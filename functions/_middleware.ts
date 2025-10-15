// functions/_middleware.ts
export const onRequest: PagesFunction = async ({ request, next }) => {
  // /posts だけ対象
  const { pathname } = new URL(request.url);
  if (!pathname.startsWith("/posts")) {
    return next();
  }

  // GET/HEAD 以外は素通し
  if (request.method !== "GET" && request.method !== "HEAD") {
    return next();
  }

  // まずオリジンの応答を取得
  const res = await next();

  // 2xx 以外は何もしない
  if (res.status < 200 || res.status >= 300) {
    return res;
  }

  // no-store は付与しない
  const cc = res.headers.get("Cache-Control") || "";
  if (/\bno-store\b/i.test(cc)) {
    return res;
  }

  // 既にETagがあればそれを使う。なければ本文から計算して付与
  let etag = res.headers.get("ETag");
  if (!etag) {
    try {
      // 本文をコピーしてハッシュ化（HEADでも安全）
      const clone = res.clone();
      const buf = await clone.arrayBuffer();
      const digest = await crypto.subtle.digest("SHA-256", buf);
      // Base64url エンコード
      const b = btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
      etag = `W/"sha256-${b}"`;
      res.headers.set("ETag", etag);
    } catch {
      // ボディが無い/ストリーミング等はスキップ
    }
  }

  // Last-Modified がなければ Date か現在時刻から付与
  if (!res.headers.get("Last-Modified")) {
    const date = res.headers.get("Date") || new Date().toUTCString();
    res.headers.set("Last-Modified", date);
  }

  // 以降、条件付きリクエストに対して 304 を判定
  const inm = request.headers.get("If-None-Match");
  const ims = request.headers.get("If-Modified-Since");

  const weakMatch = (a: string, b: string) => {
    // W/ 付きでも弱一致で比較
    const strip = (s: string) => s.replace(/^W\//, "");
    return strip(a) === strip(b);
  };

  const notModifiedByETag =
    inm && etag && inm.split(",").map(s => s.trim()).some(tag => weakMatch(tag, etag!));

  let notModifiedByLM = false;
  if (!notModifiedByETag && ims) {
    const since = Date.parse(ims);
    const last = Date.parse(res.headers.get("Last-Modified") || "");
    if (!isNaN(since) && !isNaN(last) && last <= since) {
      notModifiedByLM = true;
    }
  }

  if (notModifiedByETag || notModifiedByLM) {
    // 304 レスポンスを返す（キャッシュ系ヘッダは維持）
    const h = new Headers(res.headers);
    // ボディは無し
    return new Response(null, { status: 304, headers: h });
  }

  return res;
};
