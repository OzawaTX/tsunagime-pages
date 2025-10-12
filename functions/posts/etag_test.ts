export const onRequest: PagesFunction = async () => {
  const h = new Headers({
    "X-From-Posts-Function": "yes",
    "X-Test-Which": "posts/etag-test underscore",
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "public, max-age=60, must-revalidate"
  });
  return new Response("<h1>ETag test OK</h1>", { status: 200, headers: h });
};
