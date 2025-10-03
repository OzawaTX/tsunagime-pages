// functions/_data/withdrawn.json.ts
export const onRequest: PagesFunction = async () =>
  new Response("Not found", {
    status: 404,
    headers: {
      "X-Functions": "hit",
      "X-Robots-Tag": "noindex, noai, noimageai",
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8"
    }
  })
