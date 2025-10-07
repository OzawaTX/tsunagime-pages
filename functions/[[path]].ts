export const onRequest: PagesFunction = async (ctx) => {
  const { request, next } = ctx;
  const url = new URL(request.url);

  // /posts/<id>（末尾スラ無し）は 301 で /posts/<id>/ に付け替え
  const m = url.pathname.match(/^\/posts\/([A-Za-z0-9_\-]+)$/);
  if (m) {
    url.pathname = `/posts/${m[1]}/`;
    return new Response(null, { status: 301, headers: { Location: url.toString() } });
  }

  // ここまでで特別処理が無ければ、次へ（静的 or 個別関数）
  const res = await next();

  // 全ページ共通ヘッダ（AI/TDM拒否）
  res.headers.set('X-Robots-Tag', 'noai, noimageai');
  res.headers.set('tdm-reservation', '1');

  // デバッグ用
  res.headers.set('X-From-CatchAll', 'yes');

  return res;
};
