export const onRequest: PagesFunction = async () => {
  const h = new Headers({
    "X-From-Posts-Function": "yes",
    "X-Test-Which": "posts/ok200 v2 bump v2",
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "public, max-age=60, must-revalidate"
  });
  return new Response("ok200", { status: 200, headers: h });
};



