export const onRequest: PagesFunction = async () => {
  const h = new Headers({
    "X-From-Function": "root-ok200",
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store"
  });
  return new Response("root ok", { status: 200, headers: h });
};
