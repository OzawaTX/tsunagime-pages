/* Cloudflare Pages Middleware: common headers only */
export const onRequest: PagesFunction = async ({ request, next }) => {
  const res = await next();

  res.headers.set("X-From-Middleware", "yes");
  res.headers.set("X-Robots-Tag", "noai, noimageai");
  res.headers.set("tdm-reservation", "1");

  // /posts 下は識別ヘッダ補完
  const { pathname } = new URL(request.url);
  if (pathname.startsWith("/posts/") && !res.headers.get("X-From-Posts-Function")) {
    res.headers.set("X-From-Posts-Function", "yes");
  }
  return res;
};
