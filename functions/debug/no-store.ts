export const onRequest: PagesFunction = async () => {
  const h = new Headers();
  // 観測したいヘッダを手当たり次第にセット
  h.set("X-Debug-Route", "debug/no-store");
  h.set("X-Reason", "explicit_no_store_404");
  h.set("X-From-Posts-Function", "no"); // posts ではないことを明示
  h.set("Cache-Control", "no-store, no-cache, must-revalidate");
  h.set("CDN-Cache-Control", "no-store");
  h.set("Pragma", "no-cache");
  h.set("Expires", "0");
  h.set("X-Cache-Policy", "no-store");
  h.set("X-Robots-Tag", "noai, noimageai");
  h.set("tdm-reservation", "1");
  return new Response("debug 404", { status: 404, headers: h });
};
