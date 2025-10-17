export const onRequest: PagesFunction = async () => {
  const h = new Headers({
    "X-From-Posts-Function": "yes",
    "X-Test-Which": "posts/index",
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "public, must-revalidate, max-age=60"
  });
  return new Response("posts index ok", { status: 200, headers: h });
};
