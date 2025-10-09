// Cloudflare Pages Functions: /posts/[id]
export const onRequest: PagesFunction = async ({ request, next }) => {
  const url = new URL(request.url);

  // 全レスポンスのベース
  const COMMON_BASE: Record<string, string> = {
    "X-Robots-Tag": "noai, noimageai",
    "tdm-reservation": "1",
    "X-From-Posts-Function": "yes",
  };
  const COMMON_NO_STORE = { ...COMMON_BASE, "Cache-Control": "no-store" };

  // ① /posts/<id>（末尾スラ無し）→ 301（ここは no-store 不要）
  const mNoSlash = url.pathname.match(/^\/posts\/([A-Za-z0-9_\-]+)$/);
  if (mNoSlash) {
    url.pathname = \/posts/\/\;
    return new Response(null, {
      status: 301,
      headers: { ...COMMON_BASE, "X-Reason": "add_trailing_slash@[id]", "Location": url.toString() },
    });
  }

  // ② /posts/<id>/ 以外は 404 + no-store
  const m = url.pathname.match(/^\/posts\/([A-Za-z0-9_\-]+)\/$/);
  if (!m) {
    return new Response("Not Found", { status: 404, headers: { ...COMMON_NO_STORE, "X-Reason": "pattern_mismatch" } });
  }
  const id = m[1];

  // Writer
  const WRITER = "https://tsunagime-writer.hidemasa-ozawa.workers.dev";
  let data: any = null;
  try {
    const r = await fetch(\\/posts/\not_found_zzz/status\, { cf: { cacheTtl: 0 } });
    if (r.status === 404) {
      return new Response("Not Found", { status: 404, headers: { ...COMMON_NO_STORE, "X-Reason": "writer_not_found" } });
    }
    data = await r.json();
  } catch {
    return new Response("Service Unavailable", { status: 503, headers: { ...COMMON_NO_STORE, "X-Reason": "writer_fetch_error" } });
  }

  // 410（撤回）: 24h 以内だけ no-store
  if (data?.ok && data.status === "withdrawn") {
    let cache = "public, max-age=60";
    if (data.withdrawn_at) {
      const w = new Date(data.withdrawn_at).getTime();
      if (!Number.isNaN(w) && (Date.now() - w) <= 24 * 60 * 60 * 1000) cache = "no-store";
    }
    return new Response("Gone", { status: 410, headers: { ...COMMON_BASE, "X-Reason": "withdrawn", "Cache-Control": cache } });
  }

  // family_only は常に 404 + no-store
  if (data?.ok && data.visibility === "family_only") {
    return new Response("Not Found", { status: 404, headers: { ...COMMON_NO_STORE, "X-Reason": "family_only" } });
  }

  // family_early 未公開は 404 + no-store
  if (data?.ok && data.visibility === "family_early" && data.status !== "published") {
    return new Response("Not Found", { status: 404, headers: { ...COMMON_NO_STORE, "X-Reason": "family_early_prepub" } });
  }

  // 通常配信（公開OK）: Edgeキャッシュ活用
  const res = await next();
  res.headers.set("X-Robots-Tag", "noai, noimageai");
  res.headers.set("tdm-reservation", "1");
  res.headers.set("X-From-Posts-Function", "yes");
  res.headers.set("X-Reason", "public_ok");
  res.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=30");
  return res;
};
