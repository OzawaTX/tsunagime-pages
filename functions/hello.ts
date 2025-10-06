export const onRequest: PagesFunction = () => {
  return new Response("hello from functions", {
    status: 200,
    headers: { "X-From-Functions": "yes" }
  });
};
