export const onRequest: PagesFunction = async ({ request }) => {
  const u = new URL(request.url);
  const h = new Headers({
    "X-Debug-Route": "debug/*@function",
    "X-Pathname": u.pathname + (u.search || ""),
    "X-From-Middleware": "yes",
    "X-Robots-Tag": "noai, noimageai",
    "tdm-reservation": "1",
    "Cache-Control": "no-store, no-cache, must-revalidate",
    "CDN-Cache-Control": "no-store",
    "Pragma": "no-cache",
    "Expires": "0"
  });
  return new Response("debug no-store (from /debug/[[path]].ts)", { status: 404, headers: h });
};
