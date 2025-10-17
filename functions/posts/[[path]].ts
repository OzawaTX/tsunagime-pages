export const onRequest: PagesFunction = async ({ request }) => {
  const { pathname, search } = new URL(request.url);
  const h = new Headers({
    "X-From-Posts-Function": "yes",
    "X-Test-Which": "posts/catchall",
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  const body = JSON.stringify({ ok: true, pathname, search, note: "catchall" });
  return new Response(body, { status: 200, headers: h });
};
