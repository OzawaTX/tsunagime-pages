/* Cloudflare Pages Middleware: force rev & no-store on /posts errors (v7) */
export const onRequest: PagesFunction = async ({ request, next }) => {
  const res = await next();

  // 共通ヘッダ
  res.headers.set("X-From-Middleware", "yes");
  res.headers.set("X-Robots-Tag", "noai, noimageai");
  res.headers.set("tdm-reservation", "1");

  // 衝突対策：同名の空値上書きをねじ伏せる（delete → set）
  res.headers.delete("X-Functions-Rev");
  res.headers.set("X-Functions-Rev", "2025-10-09-v7");

  // A/B 確認用の代替名（ダッシュボード等で名前衝突しているか切り分け）
  res.headers.set("X-Build-Rev", "2025-10-09-v7");      // ← これに値が入って X-Functions-Rev が空なら“名前衝突”確定
  res.headers.set("X-Rev-Test", "2025-10-09-v7");       // ← もう1本ダミー

  const { pathname } = new URL(request.url);

  // /posts/ 以下の識別
  if (pathname.startsWith("/posts/")) {
    if (!res.headers.get("X-From-Posts-Function")) {
      res.headers.set("X-From-Posts-Function", "yes");
    }
    // 404/503 は必ず非キャッシュ（delete → set）
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
