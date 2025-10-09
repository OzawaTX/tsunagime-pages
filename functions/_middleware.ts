/* Cloudflare Pages Middleware: common headers + /debug/no-store early return */
export const onRequest: PagesFunction = async ({ request, next }) => {
  // ====== 最優先：/debug/no-store はミドルウェアから直接返す ======
  {
    const { pathname } = new URL(request.url);
    if (pathname === "/debug/no-store" || pathname === "/debug/no-store/") {
      const h = new Headers({
        "X-From-Middleware": "yes",
        "X-Debug-Route": "debug/no-store@mw",
        "X-Robots-Tag": "noai, noimageai",
        "tdm-reservation": "1",
        // エッジ/ブラウザともに非キャッシュを強制
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "CDN-Cache-Control": "no-store",
        "Pragma": "no-cache",
        "Expires": "0"
      });
      return new Response("debug no-store (from middleware)", { status: 404, headers: h });
    }
  }

  // ====== 通常フロー ======
  const res = await next();

  // 共通ヘッダ（静的/動的すべて）
  res.headers.set("X-From-Middleware", "yes");
  res.headers.set("X-Robots-Tag", "noai, noimageai");
  res.headers.set("tdm-reservation", "1");

  // /posts/ に来た応答は識別ヘッダを補完
  const { pathname } = new URL(request.url);
  if (pathname.startsWith("/posts/")) {
    if (!res.headers.get("X-From-Posts-Function")) {
      res.headers.set("X-From-Posts-Function", "yes");
    }
  }

  return res;
};
