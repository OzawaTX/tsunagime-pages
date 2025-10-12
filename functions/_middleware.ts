/* Cloudflare Pages Middleware: common headers + rev + security */
export const onRequest: PagesFunction = async ({ request, next, env }) => {
  const res = await next();
  // --- ETag/Last-Modified + 304 handling for /posts/* (middleware) ---
  try {
    const { pathname } = new URL(request.url);
    if (pathname.startsWith("/posts/") && res && res.status >= 200 && res.status < 300) {
      // 既存値を尊重
      const hasETag = !!res.headers.get("ETag");
      const hasLM   = !!res.headers.get("Last-Modified");

      // ETag が無ければ URL + rev から弱いETagを生成（安定・低衝突）
      if (!hasETag) {
        const rev = res.headers.get("X-Functions-Rev") || "rev-fallback";
        const urlSeed = new URL(request.url).pathname;
        const etag = `W/"${urlSeed}:${rev}"`;
        res.headers.set("ETag", etag);
      }

      // Last-Modified が無ければ Date or 現在時刻を採用
      if (!hasLM) {
        const dateHdr = res.headers.get("Date");
        const when = dateHdr ? new Date(dateHdr) : new Date();
        res.headers.set("Last-Modified", when.toUTCString());
      }

      // 条件付きリクエスト評価
      const inm = request.headers.get("If-None-Match");
      const ims = request.headers.get("If-Modified-Since");
      const currentEtag = res.headers.get("ETag");
      const lmHdr = res.headers.get("Last-Modified");

      // ETag はカンマ区切りに対応（弱い/強いは文字列一致でOK）
      const matchByEtag = !!(inm && currentEtag && inm.split(",").map(s => s.trim()).includes(currentEtag));
      const matchByTime = !!(ims && lmHdr && Date.parse(ims) >= Date.parse(lmHdr));

      if (matchByEtag || matchByTime) {
        // 304 はボディ無し・ヘッダ維持
        return new Response(null, { status: 304, headers: res.headers });
      }
    }
  } catch {
    // 失敗しても配信は継続
  }
  // --- /ETag block ---

  // Common
  res.headers.set("X-From-Middleware", "yes");
  res.headers.set("X-Robots-Tag", "noai, noimageai");
  res.headers.set("tdm-reservation", "1");

  // Security (落ちてもOKな穏当セット)
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Permissions-Policy","geolocation=(), microphone=()");// rev: 環境変数>既存>デフォルト
  const envRev = env?.TSUNAGIME_REV ?? env?.BUILD_REV ?? "rev-20251012-231524";
  const curRev = res.headers.get("X-Functions-Rev");
  const finalRev = (envRev && String(envRev).trim()) || (curRev && curRev.trim()) || "rev-20251012-231524";
  res.headers.set("X-Functions-Rev", String(finalRev));

  // /posts/ 応答は識別補完
  const { pathname } = new URL(request.url);
  if (pathname.startsWith("/posts/") && !res.headers.get("X-From-Posts-Function")) {
    res.headers.set("X-From-Posts-Function", "yes");
  }
  return res;
};


