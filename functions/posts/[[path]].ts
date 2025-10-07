export const onRequest: PagesFunction = async (ctx) => {
  const { request, next } = ctx;
  const url = new URL(request.url);

  // 1) /posts/<id>（末尾スラ無し）は 301 で /posts/<id>/ に付け替え
  const noSlash = url.pathname.match(/^\/posts\/([A-Za-z0-9_\-]+)$/);
  if (noSlash) {
    url.pathname = `/posts/${noSlash[1]}/`;
    return new Response(null, {
      status: 301,
      headers: {
        Location: url.toString(),
        "X-From-Posts-CatchAll": "yes",
        "X-Reason": "add_trailing_slash",
        "X-Robots-Tag": "noai, noimageai",
        "tdm-reservation": "1",
      },
    });
  }

  // 2) 拡張子つき静的（画像/CSS/JS等）は素通り（AI/TDMヘッダだけ付与）
  const isAsset = url.pathname.match(/\.(?:css|js|mjs|map|png|jpe?g|webp|avif|gif|ico|svg|txt|json|xml|pdf|woff2?)$/i);
  if (isAsset) {
    const res = await next();
    res.headers.set("X-Robots-Tag", "noai, noimageai");
    res.headers.set("tdm-reservation", "1");
    res.headers.set("X-From-Posts-CatchAll", "yes");
    return res;
  }

  // 3) それ以外（= /posts/<id>/ など）は下位の functions/posts/[id].ts に処理を渡す
  const res = await next();
  // （念のため全レスにヘッダ）
  res.headers.set("X-Robots-Tag", "noai, noimageai");
  res.headers.set("tdm-reservation", "1");
  res.headers.set("X-From-Posts-CatchAll", "yes");
  return res;
};
