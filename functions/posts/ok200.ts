export const onRequest: PagesFunction = async () => {
  const h = new Headers({
    "X-From-Posts-Function": "yes",
    "X-Test-Which": "posts/ok200",
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store"
  });
  return new Response("posts ok", { status: 200, headers: h });
};
