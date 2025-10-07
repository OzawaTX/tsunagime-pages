// functions/posts/[id]/index.ts
export const onRequest: PagesFunction = async (context) => {
  const { request, next, params } = context;
  const id = String(params?.id ?? "");
  const WRITER = "https://tsunagime-writer.hidemasa-ozawa.workers.dev";
  const baseHeaders: Record<string, string> = {
    "X-Robots-Tag": "noai, noimageai",
    "tdm-reservation": "1",
  };

  // 末尾スラ無しを301で末尾スラ付きへ
  const url = new URL(request.url);
  if (!url.pathname.endsWith("/")) {
    url.pathname = `/posts/${id}/`;
    return new Response(null, { status: 301, headers: { Location: url.toString() } });
  }

  // Writer に問い合わせ（キャッシュ回避）
  let data: any = null;
  try {
    const r = await fetch(`${WRITER}/posts/${id}/status`, { cf: { cacheTtl: 0 } });
    if (r.status === 404) {
      return new Response("Not Found", {
        status: 404,
        headers: { ...baseHeaders, "Cache-Control": "public, max-age=60" },
      });
    }
    data = await r.json();
  } catch {
    return new Response("Service Unavailable", {
      status: 503,
      headers: baseHeaders,
    });
  }

  const status = String(data?.status ?? "").trim().toLowerCase();
  const visibility = String(data?.visibility ?? "").trim().toLowerCase();

  // 撤回は410（撤回から24h以内は no-store）
  if (data?.ok && status === "withdrawn") {
    let cache = "public, max-age=60";
    const w = data?.withdrawn_at ? new Date(data.withdrawn_at).getTime() : NaN;
    if (!Number.isNaN(w) && Date.now() - w <= 24 * 60 * 60 * 1000) cache = "no-store";
    return new Response("Gone", {
      status: 410,
      headers: { ...baseHeaders, "Cache-Control": cache },
    });
  }

  // family_only は常に非露出（404）
  if (data?.ok && visibility === "family_only") {
    return new Response("Not Found", {
      status: 404,
      headers: { ...baseHeaders, "Cache-Control": "public, max-age=60" },
    });
  }

  // family_early の公開「前」は 404（公開後=published で通常配信）
  if (data?.ok && visibility === "family_early" && status !== "published") {
    return new Response("Not Found", {
      status: 404,
      headers: {
        ...baseHeaders,
        "Cache-Control": "public, max-age=60",
        "X-Debug-Reason": "family_early_prepub",
      },
    });
  }

  // ここまで来れば「公開OK」→ 静的HTMLにフォールバック
  const res = await next();
  res.headers.set("Cache-Control", "public, max-age=60");
  for (const [k, v] of Object.entries(baseHeaders)) res.headers.set(k, v);
  return res;
};
