export const onRequest: PagesFunction = async ({ request, next }) => {
  const res = await next();

  // 共通（既存ヘッダに rev を“同居”）
  // ※ 既に yes が入っている場合は追記、無い場合は新規付与
  const prev = res.headers.get("X-From-Middleware");
  const merged = prev ? (prev + "; rev=2025-10-09-v9") : ("yes; rev=2025-10-09-v9");
  res.headers.set("X-From-Middleware", merged);

  res.headers.set("X-Robots-Tag", "noai, noimageai");
  res.headers.set("tdm-reservation", "1");

  // 予備（非 X- 接頭辞）— もしこれが表示されるなら “X-” 系だけが空にされている確証
  res.headers.set("Tsunagime-Rev", "2025-10-09-v9");

  // /posts/ の識別と 404/503 の no-store 固定
  const { pathname } = new URL(request.url);
  if (pathname.startsWith("/posts/")) {
    if (!res.headers.get("X-From-Posts-Function")) {
      res.headers.set("X-From-Posts-Function", "yes");
    }
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
