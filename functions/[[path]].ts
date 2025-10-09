export const onRequest: PagesFunction = async (ctx) => {
  const { request, next } = ctx;
  const { pathname } = new URL(request.url);
  // ---- pass-through for debug & posts ----
  if (pathname.startsWith('/debug/') || pathname.startsWith('/posts/')) {
    return await next();
  }
  const { request, next } = ctx;
  const url = new URL(request.url);

  // ★ /posts/<id>（末尾スラ無し）を検出して 301 に揃える（最優先でreturn）
  const m = url.pathname.match(/^\/posts\/([A-Za-z0-9_\-]+)$/);
  if (m) {
    url.pathname = `/posts/${m[1]}/`;
    return new Response(null, {
      status: 301,
      headers: {
        "Location": url.toString(),
        "X-From-CatchAll": "yes",
        "X-Reason": "add_trailing_slash@catchAll",
        "X-Robots-Tag": "noai, noimageai",
        "tdm-reservation": "1",
      },
    });
  }

  // それ以外は次へ委譲（各関数 or 静的）
  const res = await next();
  // 共通ヘッダ
  res.headers.set("X-Robots-Tag", "noai, noimageai");
  res.headers.set("tdm-reservation", "1");
  res.headers.set("X-From-CatchAll", "yes");
  return res;
};

