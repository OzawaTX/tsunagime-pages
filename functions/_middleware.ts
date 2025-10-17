export const onRequest: PagesFunction = async ({ request, next }) => {
  const { pathname } = new URL(request.url);
  if (pathname === "/posts" || pathname.startsWith("/posts/")) {
    return await next();
  }
  return await next();
};
