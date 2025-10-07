export const onRequest: PagesFunction = async (ctx) => {
  const { request, next } = ctx;
  const url = new URL(request.url);

  // /posts/<id> 末尾スラ無し → /posts/<id>/ に 301
  const mNo = url.pathname.match(/^\/posts\/([A-Za-z0-9_\-]+)$/);
  if (mNo) {
    url.pathname = `/posts/${mNo[1]}/`;
    return new Response(null, {
      status: 301,
      headers: {
        Location: url.toString(),
        "X-From-CatchAll": "yes",
        "X-Reason": "add_trailing_slash",
        "X-Robots-Tag": "noai, noimageai",
        "tdm-reservation": "1",
      },
    });
  }

  // それ以外は素通し（共通ヘッダ付け）
  const res = await next();
  res.headers.set("X-From-CatchAll", "yes");
  res.headers.set("X-Robots-Tag", "noai, noimageai");
  res.headers.set("tdm-reservation", "1");
  return res;
};
