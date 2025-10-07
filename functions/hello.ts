export const onRequest: PagesFunction = () => {
  return new Response("hello from functions", {
    headers: { "X-From-Functions": "yes" }
  });
};
