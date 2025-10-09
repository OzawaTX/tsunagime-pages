/* Cloudflare Pages Middleware (force X-Functions-Rev + /posts error no-store, v6) */
export const onRequest: PagesFunction = async ({ request, next }) => {
  const res = await next();

  // 既存の X-Functions-Rev を消してから設定（空値/競合をねじ伏せる）
  res.headers.delete("X-Functions-Rev");
  res.headers.set("X-Functions-Rev", "2025-10-09-v6");

  // 共通ヘッダ
  res.headers.set("X-From-Middleware", "yes");
  res.headers.set("X-Robots-Tag", "noai, noimageai");
  res.headers.set("tdm-reservation", "1");

  // /posts/ 以下
  const { pathname } = new URL(request.url);
  if (pathname.startsWith("/posts/")) {
    if (!res.headers.get("X-From-Posts-Function")) {
      res.headers.set("X-From-Posts-Function", "yes");
    }
    // 404/503 は常に非キャッシュ（既存値を消してから設定）
    if (res.status === 404 || res.status === 503) {
      for (const k of ["Cache-Control","CDN-Cache-Control","Pragma","Expires"]) res.headers.delete(k);
      res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
      res.headers.set("CDN-Cache-Control", "no-store");
      res.headers.set("Pragma", "no-cache");
      res.headers.set("Expires", "0");
    }
  }

  return res;
};
