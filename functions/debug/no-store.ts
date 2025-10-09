export const onRequest: PagesFunction = async () => {
  const h = new Headers({
    "X-Debug-Route": "debug/no-store",
    "X-Robots-Tag": "noai, noimageai",
    "tdm-reservation": "1",
    // Cloudflare が落とす環境でも、CF-Cache-Status は DYNAMIC になるはず
    "Cache-Control": "no-store, no-cache, must-revalidate",
    "CDN-Cache-Control": "no-store",
    "Pragma": "no-cache",
    "Expires": "0"
  });
  h.set("X-Reason", "debug_no_store");
  return new Response("debug no-store", { status: 404, headers: h });
};
