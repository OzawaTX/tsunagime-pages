export const onRequest: PagesFunction = async ({ request, env, next }) => {
  const url = new URL(request.url)
  const norm = (p: string) => (p.endsWith('/') && p !== '/' ? p.slice(0, -1) : p)
  const here = norm(url.pathname)

  let list: Array<{ path: string; within24h?: boolean }> = []
  if (env.WRITER_BASE && env.ADMIN_TOKEN) {
    try {
      const api = new URL('/internal/export/withdrawn', env.WRITER_BASE as string)
      const res = await fetch(api.toString(), {
        headers: { 'x-admin-token': env.ADMIN_TOKEN as string },
        cf: { cacheTtl: 15 },
      })
      if (res.ok) list = await res.json()
    } catch {}
  }

  const hit = list.find(x => norm(x.path) === here)
  if (hit) {
    return new Response('', {
      status: 410,
      headers: {
        'Cache-Control': hit.within24h ? 'no-store' : 'public, max-age=60',
        'X-Robots-Tag': 'noai, noimageai',
        'tdm-reservation': '1',
        'X-Content-Type-Options': 'nosniff',
        'Content-Type': 'text/plain; charset=utf-8'
      }
    })
  }

  return next()
}
