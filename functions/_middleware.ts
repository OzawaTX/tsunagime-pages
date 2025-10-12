/* Cloudflare Pages Middleware: common headers + rev + security */
export const onRequest: PagesFunction = async ({ request, next, env }) => {
  const res = await next();

  // Common
  res.headers.set("X-From-Middleware", "yes");
  res.headers.set("X-Robots-Tag", "noai, noimageai");
  res.headers.set("tdm-reservation", "1");

  // Security (落ちてもOKな穏当セット)
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");

  // rev: 環境変数>既存>デフォルト
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
