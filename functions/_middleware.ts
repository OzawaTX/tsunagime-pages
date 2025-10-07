export const onRequest: PagesFunction = async (ctx) => {
  const { request, next } = ctx;
  const url = new URL(request.url);

  const common: Record<string, string> = {
    "X-Robots-Tag": "noai, noimageai",
    "tdm-reservation": "1",
    "X-From-Middleware": "yes",
  };

  // /posts/<id> （末尾スラ無し）は 301 で /posts/<id>/ に統一
  const noSlash = url.pathname.match(/^\/posts\/([A-Za-z0-9_\-]+)$/);
  if (noSlash) {
    url.pathname = `/posts/${noSlash[1]}/`;
    return new Response(null, {
      status: 301,
      headers: { ...common, "X-Reason": "add_trailing_slash@middleware", "Location": url.toString() },
    });
  }

  const res = await next();
  res.headers.set("X-Robots-Tag", "noai, noimageai");
  res.headers.set("tdm-reservation", "1");
  res.headers.set("X-From-Middleware", "yes");
  return res;
};
