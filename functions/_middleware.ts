export const onRequest: PagesFunction = async ({ request, next }) => {
  // 下流の関数/静的を実行
  const res = await next();

  // 共通ヘッダ（静的/動的すべてに付与）
  res.headers.set("X-Tsunagime-Functions", "yes");
  res.headers.set("X-Robots-Tag", "noai, noimageai");
  res.headers.set("tdm-reservation", "1");

  // /posts/ 以下には識別ヘッダ
  const { pathname } = new URL(request.url);
  if (pathname.startsWith("/posts/")) {
    res.headers.set("X-From-Posts-Function", "yes");
  }
  return res;
};


