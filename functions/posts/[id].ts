export const onRequest: PagesFunction = async (ctx) => {
  const { request, next } = ctx;
  const url = new URL(request.url);

  const common: Record<string, string> = {
    "X-Robots-Tag": "noai, noimageai",
    "tdm-reservation": "1",
    "X-From-Posts-Function": "yes",
  };

  // 1) /posts/<id>（末尾スラ無し）は 301 で /posts/<id>/ に正規化
  const mNoSlash = url.pathname.match(/^\/posts\/([A-Za-z0-9_\-]+)$/);
  if (mNoSlash) {
    url.pathname = `/posts/${mNoSlash[1]}/`;
    return new Response(null, {
      status: 301,
      headers: { ...common, "X-Reason": "add_trailing_slash", Location: url.toString() },
    });
  }

  // 2) ここからは /posts/<id>/ のみ
  const m = url.pathname.match(/^\/posts\/([A-Za-z0-9_\-]+)\/$/);
  if (!m) {
    return new Response("Not Found", { status: 404, headers: { ...common, "X-Reason": "pattern_mismatch" } });
  }
  const id = m[1];

  // 3) Writer から状態取得
  const WRITER = "https://tsunagime-writer.hidemasa-ozawa.workers.dev";
  let data: any;
  try {
    const r = await fetch(`${WRITER}/posts/${id}/status`, { cf: { cacheTtl: 0 } });
    if (r.status === 404) return new Response("Not Found", { status: 404, headers: { ...common, "X-Reason": "writer_not_found" } });
    data = await r.json();
  } catch {
    return new Response("Service Unavailable", { status: 503, headers: { ...common, "X-Reason": "writer_fetch_error" } });
  }

  // 4) 可視性ガード
  if (data?.ok && data.status === "withdrawn") {
    let cache = "public, max-age=60";
    if (data.withdrawn_at) {
      const w = Date.parse(data.withdrawn_at);
      if (!Number.isNaN(w) && (Date.now() - w) <= 24 * 60 * 60 * 1000) cache = "no-store";
    }
    return new Response("Gone", { status: 410, headers: { ...common, "X-Reason": "withdrawn", "Cache-Control": cache } });
  }
  if (data?.ok && data.visibility === "family_only") {
    return new Response("Not Found", { status: 404, headers: { ...common, "X-Reason": "family_only", "Cache-Control": "public, max-age=60" } });
  }
  if (data?.ok && data.visibility === "family_early" && data.status !== "published") {
    return new Response("Not Found", { status: 404, headers: { ...common, "X-Reason": "family_early_prepub", "Cache-Control": "public, max-age=60" } });
  }

  // 5) 通常配信（静的へ）。共通ヘッダは維持
  const res = await next();
  res.headers.set("X-Robots-Tag", "noai, noimageai");
  res.headers.set("tdm-reservation", "1");
  res.headers.set("X-From-Posts-Function", "yes");
  res.headers.set("X-Reason", "public_ok");
  res.headers.set("Cache-Control", "public, max-age=60");
  return res;
};
