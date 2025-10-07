// functions/posts/[id].ts
export const onRequest: PagesFunction = async (ctx) => {
  const id = String(ctx.params?.id ?? "");
  return new Response(`probe ok: ${id}`, {
    status: 418, // 目立つように I’m a teapot
    headers: {
      "X-From-Posts-Function": "yes",
      "X-Reason": "probe_file_route",
      "X-Robots-Tag": "noai, noimageai",
      "tdm-reservation": "1",
    },
  });
};
