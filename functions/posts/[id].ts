function makeError(status: number, reason: string, body: string) {
  const resp = new Headers({
    "X-Robots-Tag": "noai, noimageai",
    "tdm-reservation": "1",
    "X-From-Posts-Function": "yes",
  });
  resp.set("X-Reason", reason);
  // エッジ・ブラウザともに強制 no-store
  resp.set("Cache-Control", "no-store, no-cache, must-revalidate");
  resp.set("CDN-Cache-Control", "no-store");
  return new Response(body, { status, headers: resp });
}
// Cloudflare Pages Functions: /posts/[id]
export const onRequest: PagesFunction = async ({ request, next }) => {
  const url = new URL(request.url);

  // ベース（全レスポンスに乗せる共通ヘッダ）
  const BASE: Record<string, string> = {
    "X-Robots-Tag": "noai, noimageai",
    "tdm-reservation": "1",
    "X-From-Posts-Function": "yes",
  };

  // ① /posts/<id>（末尾スラ無し）→ 301
  const mNoSlash = url.pathname.match(/^\/posts\/([A-Za-z0-9_\-]+)$/);
  if (mNoSlash) {
    url.pathname = \/posts/\/\;
    const resp = new Response(null, { status: 301, headers: BASE });
    resp.headers.set("X-Reason", "add_trailing_slash@[id]");
    resp.headers.set("Location", url.toString());
    return resp;
  }

  // ② /posts/<id>/ のみ
  const m = url.pathname.match(/^\/posts\/([A-Za-z0-9_\-]+)\/$/);
  if (!m) {
    const resp = new Response("Not Found", { status: 404, headers: BASE });
    resp.headers.set("X-Reason", "pattern_mismatch");
      resp.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  resp.headers.set("CDN-Cache-Control", "no-store");
resp.headers.set("Cache-Control", "no-store");
    return resp;
  }
  const id = m[1];

  // Writer 取得
  const WRITER = "https://tsunagime-writer.hidemasa-ozawa.workers.dev";
  let data: any = null;
  try {
    const r = await fetch(\\/posts/\not_found_zzz/status\, { cf: { cacheTtl: 0 } });
    if (r.status === 404) {
      const resp = new Response("Not Found", { status: 404, headers: BASE });
      resp.headers.set("X-Reason", "writer_not_found");
        resp.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  resp.headers.set("CDN-Cache-Control", "no-store");
resp.headers.set("Cache-Control", "no-store");
      return resp;
    }
    data = await r.json();
  } catch {
    const resp = new Response("Service Unavailable", { status: 503, headers: BASE });
    resp.headers.set("X-Reason", "writer_fetch_error");
      resp.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  resp.headers.set("CDN-Cache-Control", "no-store");
resp.headers.set("Cache-Control", "no-store");
    return resp;
  }

  // 撤回 → 410（撤回24h以内のみ no-store）
  if (data?.ok && data.status === "withdrawn") {
    let cache = "public, max-age=60";
    if (data.withdrawn_at) {
      const w = new Date(data.withdrawn_at).getTime();
      if (!Number.isNaN(w) && (Date.now() - w) <= 24 * 60 * 60 * 1000) cache = "no-store";
    }
    const resp = new Response("Gone", { status: 410, headers: BASE });
    resp.headers.set("X-Reason", "withdrawn");
    resp.headers.set("Cache-Control", cache);
    return resp;
  }

  // family_only → 404 + no-store
  if (data?.ok && data.visibility === "family_only") {
    const resp = new Response("Not Found", { status: 404, headers: BASE });
    resp.headers.set("X-Reason", "family_only");
      resp.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  resp.headers.set("CDN-Cache-Control", "no-store");
resp.headers.set("Cache-Control", "no-store");
    return resp;
  }

  // family_early 未公開 → 404 + no-store
  if (data?.ok && data.visibility === "family_early" && data.status !== "published") {
    const resp = new Response("Not Found", { status: 404, headers: BASE });
    resp.headers.set("X-Reason", "family_early_prepub");
      resp.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  resp.headers.set("CDN-Cache-Control", "no-store");
resp.headers.set("Cache-Control", "no-store");
    return resp;
  }

  // 通常配信（公開OK）: Edgeキャッシュを活用
  const res = await next();
  res.headers.set("X-Robots-Tag", "noai, noimageai");
  res.headers.set("tdm-reservation", "1");
  res.headers.set("X-From-Posts-Function", "yes");
  res.headers.set("X-Reason", "public_ok");
  res.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=30");
  return res;
};


