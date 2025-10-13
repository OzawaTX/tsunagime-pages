/* Cloudflare Pages Middleware: common headers + rev + security */
export const onRequest: PagesFunction = async ({ request, next, env }) => {
  const res = await next();
// --- ETag/LM + 304 for /posts/* (debug-forced) ---
try {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (pathname.startsWith("/posts/")) {
    // ここは常に打刻して通過を可視化
    const rev = res.headers.get("X-Functions-Rev") || "rev-fallback";
    const dbg = `W/"${pathname}:${rev}"`;
    res.headers.set("X-ETag-Debug", dbg);
    const base = (res.headers.get("Last-Modified") || res.headers.get("Date") || new Date().toUTCString());
    res.headers.set("X-LM-Debug-Base", base);
    res.headers.set("X-MW-Probe", "etag-v2-forced");

    // 2xx のみ実ETag/LMを補完
    if (res.status >= 200 && res.status < 300) {
      if (!res.headers.get("ETag"))           res.headers.set("ETag", dbg);
      if (!res.headers.get("Last-Modified"))  res.headers.set("Last-Modified", base);

      // 条件付き判定
      const inm = request.headers.get("If-None-Match");
      const ims = request.headers.get("If-Modified-Since");
      const currentEtag = res.headers.get("ETag");
      const lmHdr = res.headers.get("Last-Modified");

      const matchByEtag = !!(inm && currentEtag && inm.split(",").map(s => s.trim()).includes(currentEtag));
      const matchByTime = !!(ims && lmHdr && Date.parse(ims) >= Date.parse(lmHdr));

      // 条件付き変化に反応するように
      res.headers.set("Vary", [res.headers.get("Vary"), "If-None-Match", "If-Modified-Since"].filter(Boolean).join(", "));

      if (matchByEtag || matchByTime) {
        return new Response(null, { status: 304, headers: res.headers });
      }
    } else {
      // なぜ実ETagを付けなかったかの理由
      res.headers.set("X-Why-No-ETag", `status=${res.status}`);
    }
  }
} catch (e) {
  res.headers.set("X-MW-Probe-Error", "etag-block-error");
}
// --- /ETag block ---
  //\ ---\ ETag/Last-Modified\ \+\ 304\ handling\ for\ /posts/\*\ \(middleware\ v2\)\ ---
try\ \{
\ \ const\ url\ =\ new\ URL\(request\.url\);
\ \ const\ pathname\ =\ url\.pathname;

\ \ if\ \(pathname\.startsWith\("/posts/"\)\)\ \{
\ \ \ \ //\ デバッグ印は常に（通過確認）
\ \ \ \ const\ rev\ =\ res\.headers\.get\("X-Functions-Rev"\)\ \|\|\ "rev-fallback";
\ \ \ \ const\ etagDbg\ =\ `W:"\$\{pathname}:\$\{rev}"`;
\ \ \ \ res\.headers\.set\("X-ETag-Debug",\ etagDbg\);
\ \ \ \ res\.headers\.set\("X-LM-Debug-Base",\ \(res\.headers\.get\("Last-Modified"\)\ \|\|\ res\.headers\.get\("Date"\)\ \|\|\ new\ Date\(\)\.toUTCString\(\)\)\);

\ \ \ \ //\ 2xx\ のときだけ実際の\ ETag/Last-Modified\ を補完
\ \ \ \ if\ \(res\.status\ >=\ 200\ &&\ res\.status\ <\ 300\)\ \{
\ \ \ \ \ \ if\ \(!res\.headers\.get\("ETag"\)\)\ \{
\ \ \ \ \ \ \ \ res\.headers\.set\("ETag",\ etagDbg\);
\ \ \ \ \ \ }
\ \ \ \ \ \ if\ \(!res\.headers\.get\("Last-Modified"\)\)\ \{
\ \ \ \ \ \ \ \ const\ base\ =\ res\.headers\.get\("Date"\)\ \|\|\ new\ Date\(\)\.toUTCString\(\);
\ \ \ \ \ \ \ \ res\.headers\.set\("Last-Modified",\ base\);
\ \ \ \ \ \ }
\ \ \ \ \ \ //\ 条件付きリクエスト評価
\ \ \ \ \ \ const\ inm\ =\ request\.headers\.get\("If-None-Match"\);
\ \ \ \ \ \ const\ ims\ =\ request\.headers\.get\("If-Modified-Since"\);
\ \ \ \ \ \ const\ currentEtag\ =\ res\.headers\.get\("ETag"\);
\ \ \ \ \ \ const\ lmHdr\ =\ res\.headers\.get\("Last-Modified"\);

\ \ \ \ \ \ //\ ETag:\ カンマ区切り対応
\ \ \ \ \ \ const\ matchByEtag\ =\ !!\(inm\ &&\ currentEtag\ &&\ inm\.split\(","\)\.map\(s\ =>\ s\.trim\(\)\)\.includes\(currentEtag\)\);
\ \ \ \ \ \ //\ If-Modified-Since:\ LM\ 以降なら\ 304
\ \ \ \ \ \ const\ matchByTime\ =\ !!\(ims\ &&\ lmHdr\ &&\ Date\.parse\(ims\)\ >=\ Date\.parse\(lmHdr\)\);

\ \ \ \ \ \ //\ 条件付きを使うクライアント向けヒント
\ \ \ \ \ \ res\.headers\.set\("Vary",\ \[res\.headers\.get\("Vary"\),\ "If-None-Match",\ "If-Modified-Since"]\.filter\(Boolean\)\.join\(",\ "\)\);

\ \ \ \ \ \ if\ \(matchByEtag\ \|\|\ matchByTime\)\ \{
\ \ \ \ \ \ \ \ return\ new\ Response\(null,\ \{\ status:\ 304,\ headers:\ res\.headers\ }\);
\ \ \ \ \ \ }
\ \ \ \ }
\ \ }
}\ catch\ \{
\ \ //\ 失敗しても配信継続
}
//\ ---\ /ETag\ block\ ---

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




