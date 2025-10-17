export const onRequest: PagesFunction = async () => {
  return new Response("ok200", {
    status: 200,
    headers: {
      "X-From-Posts-Function": "yes",
      "X-Test-Which": "posts/ok200",
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, must-revalidate, max-age=60"
    }
  });
};
