export const onRequest: PagesFunction = async ({ request, next }) => {
  const res = await next();

  // 共通
  res.headers.set("X-From-Middleware", "yes");
  res.headers.set("X-Robots-Tag", "noai, noimageai");
  res.headers.set("tdm-reservation", "1");

  // まず全部いったん削除（後勝ち対策）
  for (const k of [
    "X-Functions-Rev","X-Build-Rev","X-Rev-Test","X-Release",
    "X-Build","X-Tag","X-Trace","X-Trace-Id","X-RevZ",
    "X_Rev_Under","X.Rev.Dot","X-Rev-123","X-REV-UPPER"
  ]) res.headers.delete(k);

  // 値をセット（名前ごとの出方を比較）
  res.headers.set("X-Functions-Rev", "2025-10-09-v8");
  res.headers.set("X-Build-Rev", "2025-10-09-v8");
  res.headers.set("X-Rev-Test", "2025-10-09-v8");
  res.headers.set("X-Release", "2025-10-09-v8");
  res.headers.set("X-Build", "2025-10-09-v8");
  res.headers.set("X-Tag", "2025-10-09-v8");
  res.headers.set("X-Trace", "2025-10-09-v8");
  res.headers.set("X-Trace-Id", "2025-10-09-v8");
  res.headers.set("X-RevZ", "2025-10-09-v8");
  res.headers.set("X_Rev_Under", "2025-10-09-v8");
  res.headers.set("X.Rev.Dot", "2025-10-09-v8");
  res.headers.set("X-Rev-123", "2025-10-09-v8");
  res.headers.set("X-REV-UPPER", "2025-10-09-v8");

  // /posts の 404/503 は確実に no-store（delete → set）
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
