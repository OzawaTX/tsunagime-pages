export const onRequest: PagesFunction = async () => {
  return new Response("probe ok", {
    status: 200,
    headers: {
      "X-From-Posts-Function": "yes",
      "X-Test-Which": "posts/__probe",
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
};
