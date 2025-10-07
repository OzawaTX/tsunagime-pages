export const onRequest: PagesFunction = async (ctx) => {
  const { request, next } = ctx;
  const url = new URL(request.url);

  // 共通ヘッダ
  const common: Record<string, string> = {
    "X-Robots-Tag": "noai, noimageai",
    "tdm-reservation": "1",
    "X-From-CatchAll": "yes",
  };

  // /posts/<id>（末尾スラ無し）は 301 で /posts/<id>/ に正規化
  const noSlash = url.pathname.match(/^\/posts\/([A-Za-z0-9_\-]+)$/);
  if (noSlash) {
    url.pathname = `/posts/${noSlash[1]}/`;
    return new Response(null, {
      status: 301,
      headers: { ...common, "Location": url.toString() },
    });
  }

  // それ以外は通常の配信へ
  const res = await next();
  // 全レスポンスに共通ヘッダ付与
  res.headers.set("X-Robots-Tag", "noai, noimageai");
  res.headers.set("tdm-reservation", "1");
  res.headers.set("X-From-CatchAll", "yes");
  return res;
};

