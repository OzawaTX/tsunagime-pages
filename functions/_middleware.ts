export const onRequest: PagesFunction = async ({ request, next }) => {
  const url = new URL(request.url);
  // /posts 以外は素通し
  if (!(url.pathname === "/posts" || url.pathname.startsWith("/posts/"))) {
    return await next();
  }

  // まず下流（各ハンドラ）を実行
  const res = await next();

  // GET かつ 2xx のみ対象。明示 no-store の場合は触らない
  const isGet = request.method === "GET";
  const ok2xx = res.status >= 200 && res.status < 300;
  const noStore = (res.headers.get("Cache-Control") || "").includes("no-store");
  if (!isGet || !ok2xx || noStore) return res;

  // 本文を読んで弱いETagを作成（SHA-1の先頭8バイト）
  const txt = await res.clone().text();
  const buf = new TextEncoder().encode(txt);
  const digest = await crypto.subtle.digest("SHA-1", buf);
  const etagHex = Array.from(new Uint8Array(digest))
    .slice(0, 8)
    .map(b => b.toString(16).padStart(2, "0")).join("");
  const etag = `W/"${etagHex}"`;
  const lm = new Date().toUTCString();

  // 条件付き：If-None-Match が一致なら 304
  const inm = request.headers.get("If-None-Match");
  if (inm && inm === etag) {
    const h = new Headers(res.headers);
    h.set("ETag", etag);
    h.set("Last-Modified", lm);
    if (!h.has("Cache-Control")) h.set("Cache-Control", "public, must-revalidate, max-age=60");
    h.append("Vary", "accept-encoding");
    return new Response(null, { status: 304, headers: h });
  }

  // それ以外はレスポンスに付与して返す
  res.headers.set("ETag", etag);
  res.headers.set("Last-Modified", lm);
  if (!res.headers.has("Cache-Control")) {
    res.headers.set("Cache-Control", "public, must-revalidate, max-age=60");
  }
  res.headers.append("Vary", "accept-encoding");
  return res;
};
