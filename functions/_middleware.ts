// Cloudflare Pages Middleware (common headers for static & functions)
export const onRequest: PagesFunction = async ({ request, next }) => {
  const res = await next();

  // 共通ヘッダ
  res.headers.set("X-From-Middleware", "yes");
  res.headers.set("X-Robots-Tag", "noai, noimageai");
  res.headers.set("tdm-reservation", "1");
  res.headers.set("X-Functions-Rev", "2025-10-09-v3");

  // /posts/ 以下には識別ヘッダ
  const { pathname } = new URL(request.url);
  if (pathname.startsWith("/posts/")) {
    res.headers.set("X-From-Posts-Function", res.headers.get("X-From-Posts-Function") ?? "yes");
  }

  return res;
};
