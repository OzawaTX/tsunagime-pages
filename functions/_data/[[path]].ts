// functions/_data/[[path]].ts
export const onRequest: PagesFunction = async () =>
  new Response("Not found", {
    status: 404,
    headers: {
      "X-Robots-Tag": "noindex, noai, noimageai",
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
    },
  })
