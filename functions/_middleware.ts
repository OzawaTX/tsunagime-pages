export const onRequest: PagesFunction = async ({ request, next }) => {
  const res = await next();

  // 全レスポンスに共通ヘッダを付与（静的配信も含む）
  res.headers.set("X-From-Functions", "yes");
  res.headers.set("X-Robots-Tag", "noai, noimageai");
  res.headers.set("tdm-reservation", "1");

  // /posts/ 以下には識別ヘッダも（既に付けていれば上書きOK）
  const { pathname } = new URL(request.url);
  if (pathname.startsWith("/posts/")) {
    res.headers.set("X-From-Posts-Function", "yes");
  }
  return res;
};
