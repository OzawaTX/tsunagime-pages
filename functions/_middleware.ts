// functions/_middleware.ts
export const onRequest: PagesFunction = async (context) => {
  const { request, next } = context;
  const url = new URL(request.url);
  const REV = "family-early-404-v1"; // 反映確認用ヘッダ

  // 共通で付けたいヘッダ（必要に応じて追加）
  const baseHeaders: Record<string, string> = {
    "X-Robots-Tag": "noai, noimageai",
    "tdm-reservation": "1",
  };

  // 1) 静的系・許可パスは素通り（ただしヘッダは付ける）
  const ext = url.pathname.match(
    /\.(?:css|js|mjs|map|png|jpe?g|webp|avif|gif|ico|svg|txt|json|xml|pdf|woff2?)$/i
  );
  if (
    url.pathname.startsWith("/_pagefind") ||
    url.pathname.startsWith("/_data") ||
    url.pathname === "/ping" ||
    ext
  ) {
    const res = await next();
    res.headers.set("X-Functions-Rev", REV);
    for (const [k, v] of Object.entries(baseHeaders)) res.headers.set(k, v);
    return res;
  }

  // 2) /posts/<ID> → 末尾スラ無しは301で付与
  const noSlash = url.pathname.match(/^\/posts\/([A-Za-z0-9_\-]+)$/);
  if (noSlash) {
    url.pathname = `/posts/${noSlash[1]}/`;
    return new Response(null, { status: 301, headers: { Location: url.toString() } });
  }

  // 3) /posts/<ID>/ の公開制御
  const m = url.pathname.match(/^\/posts\/([A-Za-z0-9_\-]+)\/$/);
  if (m) {
    const id = m[1];
    const WRITER = "https://tsunagime-writer.hidemasa-ozawa.workers.dev";

    let data: any = null;
    try {
      const r = await fetch(`${WRITER}/posts/${id}/status`, {
        // Writer側は常に生の値を見たい（キャッシュさせない）
        cf: { cacheTtl: 0, cacheEverything: false },
      });

      // Writerに存在しないIDでもAI/TDM拒否ヘッダは必ず付けて返す
      if (r.status === 404) {
        return new Response("Not Found", {
          status: 404,
          headers: {
            ...baseHeaders,
            "X-Functions-Rev": REV,
            "Cache-Control": "public, max-age=60",
          },
        });
      }

      data = await r.json();
    } catch {
      return new Response("Service Unavailable", {
        status: 503,
        headers: { ...baseHeaders, "X-Functions-Rev": REV },
      });
    }

    // 値の安全化（トリム＋小文字）
    const status = String(data?.status ?? "").trim().toLowerCase();
    const visibility = String(data?.visibility ?? "").trim().toLowerCase();

    // 3-1) 撤回は410（撤回から24h以内は no-store）
    if (data?.ok && status === "withdrawn") {
      let cache = "public, max-age=60";
      const w = data?.withdrawn_at ? new Date(data.withdrawn_at).getTime() : NaN;
      if (!Number.isNaN(w) && Date.now() - w <= 24 * 60 * 60 * 1000) {
        cache = "no-store";
      }
      return new Response("Gone", {
        status: 410,
        headers: {
          ...baseHeaders,
          "X-Functions-Rev": REV,
          "Cache-Control": cache,
        },
      });
    }

    // 3-2) family_only は常に非露出（404）
    if (data?.ok && visibility === "family_only") {
      return new Response("Not Found", {
        status: 404,
        headers: {
          ...baseHeaders,
          "X-Functions-Rev": REV,
          "Cache-Control": "public, max-age=60",
        },
      });
    }

    // 3-3) ★ family_early の公開「前」は 404（公開後=published になったら通常配信）
    if (data?.ok && visibility === "family_early" && status !== "published") {
      return new Response("Not Found", {
        status: 404,
        headers: {
          ...baseHeaders,
          "X-Functions-Rev": REV,
          "X-Debug-Reason": "family_early_prepub",
          "Cache-Control": "public, max-age=60",
        },
      });
    }

    // 3-4) 通常配信（公開済み or public_on_date 等）
    const res = await next();
    res.headers.set("X-Functions-Rev", REV);
    for (const [k, v] of Object.entries(baseHeaders)) res.headers.set(k, v);
    // 公開側は軽めにキャッシュ
    res.headers.set("Cache-Control", "public, max-age=60");
    return res;
  }

  // 4) それ以外のパス
  const res = await next();
  res.headers.set("X-Functions-Rev", REV);
  for (const [k, v] of Object.entries(baseHeaders)) res.headers.set(k, v);
  return res;
};


