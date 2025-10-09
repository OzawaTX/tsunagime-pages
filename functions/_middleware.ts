/* Cloudflare Pages Middleware: force early return for /debug/no-store (+tracing) */
export const onRequest: PagesFunction = async ({ request, next }) => {
  // ===== EARLY RETURN: /debug/no-store* は必ずここから 404 を返す =====
  {
    const u = new URL(request.url);
    const pathname = u.pathname;
    // 末尾スラ有無/クエリ有無/将来のサブパスにも強めに対応
    if (pathname === "/debug/no-store" || pathname === "/debug/no-store/" || pathname.startsWith("/debug/no-store")) {
      const h = new Headers({
        "X-Hit-Point": "mw-early",
        "X-Debug-Route": "debug/no-store@mw",
        "X-Pathname": pathname,
        "X-From-Middleware": "yes",
        "X-Robots-Tag": "noai, noimageai",
        "tdm-reservation": "1",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "CDN-Cache-Control": "no-store",
        "Pragma": "no-cache",
        "Expires": "0"
      });
      return new Response("debug no-store (from middleware early return)", { status: 404, headers: h });
    }
  }

  // ===== 通常フロー =====
  const res = await next();

  // 共通ヘッダ（ダブり防止のため set だけ）
  res.headers.set("X-From-Middleware", "yes");
  res.headers.set("X-Robots-Tag", "noai, noimageai");
  res.headers.set("tdm-reservation", "1");

  // /posts/ 応答の識別補完
  const { pathname } = new URL(request.url);
  if (pathname.startsWith("/posts/")) {
    if (!res.headers.get("X-From-Posts-Function")) {
      res.headers.set("X-From-Posts-Function", "yes");
    }
  }

  return res;
};
