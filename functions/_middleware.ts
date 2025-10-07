export const onRequest: PagesFunction = async (context) => {
  const { request, next } = context;
  const url = new URL(request.url);

  // 共通ヘッダ（AI/TDM拒否）
  const common = {
    "X-Robots-Tag": "noai, noimageai",
    "tdm-reservation": "1",
    // デバッグ用に今のREVを見たい時は適宜変更
    "X-Functions-Rev": "route-probe-pass-v1",
  };

  // 静的系は素通り（ヘッダだけ付ける）
  const isStatic = url.pathname.match(/\.(?:css|js|mjs|map|png|jpe?g|webp|avif|gif|ico|svg|txt|json|xml|pdf|woff2?)$/i);
  if (url.pathname.startsWith("/_pagefind") || url.pathname.startsWith("/_data") || url.pathname === "/ping" || isStatic) {
    const res = await next();
    for (const [k, v] of Object.entries(common)) res.headers.set(k, v);
    return res;
  }

  // ★ここがポイント：
  // 以前は /posts/<ID>/ をミドルウェアで握って Writer に聞いて 404/410 を返していた。
  // いったん “握らずに” next() でルート関数（functions/posts/[id].ts）へ通す。
  const res = await next();
  for (const [k, v] of Object.entries(common)) res.headers.set(k, v);
  return res;
};
