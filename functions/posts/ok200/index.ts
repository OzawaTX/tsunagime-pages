export const onRequest: PagesFunction = async () => {
  const h = new Headers({
    "X-From-Posts-Function": "yes",
    "Content-Type": "text/plain; charset=utf-8",
    // ミドルウェアのETag/LM付与と独立
    "Cache-Control": "public, max-age=60, must-revalidate"
  });
  return new Response("ok200", { status: 200, headers: h });
};
