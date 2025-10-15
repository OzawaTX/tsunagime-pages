// functions/posts/ok200.ts
export const onRequest: PagesFunction = async () => {
  return new Response("ok200", {
    status: 200,
    headers: {
      "X-From-Posts-Function": "yes",
      "X-Test-Which": "posts/ok200",
      "Content-Type": "text/plain; charset=utf-8",
      // ← ここを cacheable に（must-revalidate を付ける）
      "Cache-Control": "public, max-age=60, must-revalidate"
    }
  });
};
