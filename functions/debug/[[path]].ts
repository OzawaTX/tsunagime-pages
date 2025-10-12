export const onRequest: PagesFunction = async ({ request }) => {
  const { pathname, search } = new URL(request.url);
  const h = new Headers({
    "X-Debug-Route": "debug/*@function",
    "X-Pathname": pathname + (search || ""),
    "X-From-Posts-Function": "",
    "X-From-Middleware": "yes",
    "X-Robots-Tag": "noai, noimageai",
    "tdm-reservation": "1",
    "Cache-Control": "no-store, no-cache, must-revalidate",
    "CDN-Cache-Control": "no-store",
    "Pragma": "no-cache",
    "Expires": "0"
  });
  return new Response("debug no-store (catch-all under /debug)", { status: 404, headers: h });
};
