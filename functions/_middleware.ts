/* Cloudflare Pages Middleware: FORCE short-circuit for /debug/* */
export const onRequest: PagesFunction = async ({ request, next }) => {
  const u = new URL(request.url);
  const p = u.pathname;

  // ===== 強制ショートサーキット（/debug/* 全部）=====
  if (p === "/debug" || p.startsWith("/debug/")) {
    const h = new Headers({
      "X-Hit-Point": "mw-early",
      "X-Debug-Route": "debug/*@mw",
      "X-Pathname": p,
      "X-From-Middleware": "yes",
      "X-Robots-Tag": "noai, noimageai",
      "tdm-reservation": "1",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "CDN-Cache-Control": "no-store",
      "Pragma": "no-cache",
      "Expires": "0"
    });
    return new Response("blocked by middleware (/debug/*)", { status: 404, headers: h });
  }

  // ===== 通常フロー =====
  const res = await next();

  // 共通ヘッダ
  res.headers.set("X-From-Middleware", "yes");
  res.headers.set("X-Robots-Tag", "noai, noimageai");
  res.headers.set("tdm-reservation", "1");

  // /posts/ の識別補完
  if (p.startsWith("/posts/") && !res.headers.get("X-From-Posts-Function")) {
    res.headers.set("X-From-Posts-Function", "yes");
  }

  return res;
};
