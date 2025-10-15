export const onRequest: PagesFunction = async ({ next }) => {
  // temporary minimal middleware: just pass through
  return await next();
};
