export const onRequest: PagesFunction = async () => {
  const h = new Headers({
    "X-From-Posts-Function": "yes",
    "X-Test-Which": "posts/etag-test",
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store"
  });
  return new Response("posts etag-test ok", { status: 200, headers: h });
};
