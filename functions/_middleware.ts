/* Cloudflare Pages Middleware (common headers + /posts error caching policy) */
export const onRequest: PagesFunction = async ({ request, next }) => {
  const res = await next();

  // 共通ヘッダ（静的/動的すべて）
  res.headers.set('X-From-Middleware', 'yes');
  res.headers.set('X-Robots-Tag', 'noai, noimageai');
  res.headers.set('tdm-reservation', '1');
  res.headers.set('X-Functions-Rev', '2025-10-09-v4');

  // /posts/ 以下の識別（Functions 側で未設定なら補完）
  const { pathname } = new URL(request.url);
  if (pathname.startsWith('/posts/')) {
    if (!res.headers.get('X-From-Posts-Function')) {
      res.headers.set('X-From-Posts-Function', 'yes');
    }

    // 404/503 は常に非キャッシュ（エッジとブラウザの両方を確実に抑制）
    if (res.status === 404 || res.status === 503) {
      res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.headers.set('CDN-Cache-Control', 'no-store');
      res.headers.set('Pragma', 'no-cache');
      res.headers.set('Expires', '0');
    }
  }

  return res;
};
