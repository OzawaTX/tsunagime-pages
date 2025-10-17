export const onRequest: PagesFunction = async ({ request, next }) => {
  // ↓ ここで /posts とその配下は一切触らず Functions へ委譲
  const { pathname } = new URL(request.url);
  if (pathname === "/posts" || pathname.startsWith("/posts/")) {
    return await next();
  }
  // 他パスもそのまま通す（必要なら後で機能を戻す）
  return await next();
};
