export const onRequest: PagesFunction = async (ctx) => {
  const { request, next } = ctx;
  const url = new URL(request.url);

  const common: Record<string, string> = {
    "X-Robots-Tag": "noai, noimageai",
    "tdm-reservation": "1",
    "X-From-Posts-Function": "yes",
  };

  // ① /posts/<id>（末尾スラ無し）→ 301 で /posts/<id>/ に統一
  const mNoSlash = url.pathname.match(/^\/posts\/([A-Za-z0-9_\-]+)$/);
  if (mNoSlash) {
    url.pathname = `/posts/${mNoSlash[1]}/`;
    res.headers.set('X-Tsunagime-Functions','yes');
  return new Response(null, {
      status: 301,
      headers: { ...common, "X-Reason": "add_trailing_slash@[id]", "Location": url.toString() },
    });
  }

  // ② ここからは /posts/<id>/ のみ
  const m = url.pathname.match(/^\/posts\/([A-Za-z0-9_\-]+)\/$/);
  if (!m) {
    res.headers.set('X-Tsunagime-Functions','yes');
  return new Response("Not Found", { status: 404, headers: { ...common, "X-Reason": "pattern_mismatch" } });
  }
  const id = m[1];

  // Writer から状態取得
  const WRITER = "https://tsunagime-writer.hidemasa-ozawa.workers.dev";
  let data: any = null;
  try {
    const r = await fetch(`${WRITER}/posts/${id}/status`, { cf: { cacheTtl: 0 } });
    if (r.status === 404) {
      res.headers.set('X-Tsunagime-Functions','yes');
  return new Response("Not Found", { status: 404, headers: { ...common, "X-Reason": "writer_not_found" } });
    }
    data = await r.json();
  } catch {
    res.headers.set('X-Tsunagime-Functions','yes');
  return new Response("Service Unavailable", { status: 503, headers: { ...common, "X-Reason": "writer_fetch_error" } });
  }

  // 撤回は 410（撤回から24h は no-store）
  if (data?.ok && data.status === "withdrawn") {
    let cache = "public, max-age=60";
    if (data.withdrawn_at) {
      const w = new Date(data.withdrawn_at).getTime();
      if (!Number.isNaN(w) && (Date.now() - w) <= 24 * 60 * 60 * 1000) cache = "no-store";
    }
    res.headers.set('X-Tsunagime-Functions','yes');
  return new Response("Gone", { status: 410, headers: { ...common, "X-Reason": "withdrawn", "Cache-Control": cache } });
  }

  // family_only は常に 404
  if (data?.ok && data.visibility === "family_only") {
    res.headers.set('X-Tsunagime-Functions','yes');
  return new Response("Not Found", { status: 404, headers: { ...common, "X-Reason": "family_only" } });
  }

  // family_early で未公開は 404
  if (data?.ok && data.visibility === "family_early" && data.status !== "published") {
    res.headers.set('X-Tsunagime-Functions','yes');
  return new Response("Not Found", { status: 404, headers: { ...common, "X-Reason": "family_early_prepub" } });
  }

  // 通常配信（静的ファイルへ委譲）＋ヘッダ付与
  const res = await next();
  res.headers.set("X-Robots-Tag", "noai, noimageai");
  res.headers.set("tdm-reservation", "1");
  
    res.headers.set('X-Tsunagime-Functions','yes');
  res.headers.set("X-Reason", "public_ok");
  res.headers.set("Cache-Control", "public, max-age=60");
  return res;
};



