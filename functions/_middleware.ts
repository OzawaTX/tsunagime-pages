/* Cloudflare Pages Middleware: common headers + safe rev */
export const onRequest: PagesFunction = async ({ request, next, env }) => {
    // --- 🔧 /debug/no-store は最優先でここから返す（Functions到達の強制確認用） ---
  {
    const { pathname } = new URL(request.url);
    if (pathname === "/debug/no-store" || pathname === "/debug/no-store/") {
      const h = new Headers({
        "X-From-Middleware": "yes",
        "X-Debug-Route": "debug/no-store@mw",
        "X-Robots-Tag": "noai, noimageai",
        "tdm-reservation": "1",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "CDN-Cache-Control": "no-store",
        "Pragma": "no-cache",
        "Expires": "0"
      });
      return new Response("debug no-store (from middleware)", { status: 404, headers: h });
    }
  }
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
    // 404/503 は no-store を“予備ヘッダ”でも明示
    if (res.status === 404 || res.status === 503) {
      res.headers.set('Pragma', 'no-cache');      // 旧式ブラウザ系
      res.headers.set('Expires', '0');            // 即時失効
      res.headers.set('X-Cache-Policy', 'no-store'); // 監視用マーカー
    }
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


