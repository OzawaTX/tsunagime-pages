export const onRequest: PagesFunction = async ({ request, next }) => {
// --- Safe cache-control for /posts/ --- marker:safe-cache
if (pathname.startsWith("/posts/")) {
  const res = await next();
  if (res.status >= 200 && res.status < 300) {
    const h = new Headers(res.headers);
    h.set("Cache-Control", "public, no-cache, must-revalidate");
    return new Response(res.body, { status: res.status, headers: h });
  }
  return res;
}
  const url = new URL(request.url);

  // ミドルウェア通過印（動作確認用）
  const passThroughHeaders = { "X-From-Middleware": "yes" } as Record<string, string>;

  // /posts/ 以外は素通し
  if (!url.pathname.startsWith("/posts/")) {
    const r = await next();
    const res = new Response(r.body, r);
    Object.entries(passThroughHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }

  // /posts/** は検査
  const originRes = await next();
  const status = originRes.status;

  // 2xx 以外はそのまま返す（404/5xx 等）
  if (status < 200 || status >= 300) {
    const res = new Response(originRes.body, originRes);
    Object.entries(passThroughHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }

  // Body をテキスト化できるものだけ対象（text/ と application/json）
  const ct = originRes.headers.get("Content-Type") || "";
  const isTextLike = /\b(text\/|application\/json)/i.test(ct);
  if (!isTextLike || originRes.body === null) {
    const res = new Response(originRes.body, originRes);
    Object.entries(passThroughHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }

  // 既存 ETag/LM があれば尊重（そのまま 304 判定に使う）
  let etag = originRes.headers.get("ETag");
  let lastModified = originRes.headers.get("Last-Modified");

  // なければ計算して付与（弱い ETag）
  if (!etag || !lastModified) {
    const text = await originRes.clone().text();
    // SHA-256 -> 先頭 16 hex で弱い ETag を作る（十分安定・軽量）
    const enc = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest("SHA-256", enc);
    const hashHex = [...new Uint8Array(digest)].slice(0, 8).map(b => b.toString(16).padStart(2, "0")).join("");
    if (!etag) etag = `W/"${hashHex}"`;
    if (!lastModified) lastModified = new Date().toUTCString();
  }

  // 条件付きリクエストの評価
  const inm = request.headers.get("If-None-Match");
  const ims = request.headers.get("If-Modified-Since");
  const matchETag = inm && inm.split(",").map(s => s.trim()).includes(etag);
  const notModifiedByTime = ims && new Date(ims).getTime() >= new Date(lastModified).getTime();

  // 304 を返す時はヘッダを必ず付け直す（Vary 等も整える）
  if (matchETag || notModifiedByTime) {
    const res304 = new Response(null, {
      status: 304,
      headers: {
        "ETag": etag,
        "Last-Modified": lastModified,
        "Vary": "accept-encoding",
      },
    });
    Object.entries(passThroughHeaders).forEach(([k, v]) => res304.headers.set(k, v));
    // Cache-Control はオリジン設定を踏襲
    const cc = originRes.headers.get("Cache-Control");
    if (cc) res304.headers.set("Cache-Control", cc);
    return res304;
  }

  // 200 系で返す場合も ETag/LM/Vary を付けて返却
  const res200 = new Response(originRes.body, originRes);
  res200.headers.set("ETag", etag);
  res200.headers.set("Last-Modified", lastModified);
  res200.headers.set("Vary", "accept-encoding");
  Object.entries(passThroughHeaders).forEach(([k, v]) => res200.headers.set(k, v));
  return res200;
};

