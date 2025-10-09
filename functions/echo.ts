export const onRequestGet: PagesFunction = async () => {
  return new Response(JSON.stringify({ ok: true, route: "/echo" }), {
    status: 200,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
