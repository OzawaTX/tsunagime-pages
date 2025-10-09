/* Cloudflare Pages Middleware: common headers + safe rev */
export const onRequest: PagesFunction = async ({ request, next, env }) => {
  const res = await next();

  // 共通ヘッダ
  res.headers.set('X-From-Middleware','yes');
  res.headers.set('X-Robots-Tag','noai, noimageai');
  res.headers.set('tdm-reservation','1');

  // rev は (1) 環境変数 > (2) 既存値 > (3) デフォルト の順で決定
  const existing = res.headers.get('X-Functions-Rev');
  const candidate = (env?.TSUNAGIME_REV ?? env?.BUILD_REV ?? 'rev-20251009-233035');
  const finalRev = (candidate && String(candidate).trim().length > 0) ? candidate :
                   (existing && existing.trim().length > 0) ? existing :
                   'rev-20251009-233035';
  res.headers.set('X-Functions-Rev', String(finalRev));

  // /posts/ 以下のエラーは no-store を強制
  const { pathname } = new URL(request.url);
  if (pathname.startsWith('/posts/')) {
    if (!res.headers.get('X-From-Posts-Function')) {
      res.headers.set('X-From-Posts-Function','yes');
    }
    if (res.status === 404 || res.status === 503) {
      res.headers.set('Cache-Control','no-store, no-cache, must-revalidate');
      res.headers.set('CDN-Cache-Control','no-store');
      res.headers.set('Pragma','no-cache');
      res.headers.set('Expires','0');
    }
  }

  return res;
};
