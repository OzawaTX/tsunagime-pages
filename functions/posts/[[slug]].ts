export const onRequest: PagesFunction = async (ctx) => {
  const { request, next } = ctx;
  const url = new URL(request.url);

  // 共通ヘッダ（デバッグ用も少し）
  const common = {
    "X-Robots-Tag": "noai, noimageai",
    "tdm-reservation": "1",
    "X-From-Posts-CatchAll": "yes",
  } as Record<string, string>;

  // ★ /posts/<id>（末尾スラ無し）を検出して 301 に揃える
  const noSlash = url.pathname.match(/^\/posts\/([A-Za-z0-9_\-]+)$/);
  if (noSlash) {
    url.pathname = `/posts/${noSlash[1]}/`;
    return new Response(null, {
      status: 301,
      headers: { ...common, "X-Reason": "add_trailing_slash@catchAll", "Location": url.toString() },
    });
  }

  // それ以外（/posts/<id>/ や /posts/xxx/yyy など）は次へ委譲
  const res = await next();
  // ついでに共通ヘッダを付加
  res.headers.set("X-Robots-Tag", "noai, noimageai");
  res.headers.set("tdm-reservation", "1");
  res.headers.set("X-From-Posts-CatchAll", "yes");
  return res;
};
