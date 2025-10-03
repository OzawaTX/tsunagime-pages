export const onRequest: PagesFunction = async ({ request, env, next }) => {
  const url = new URL(request.url)
  const norm = (p: string) => (p.endsWith('/') && p !== '/' ? p.slice(0, -1) : p)
  const here = norm(url.pathname)

  if (here === '/ping') return next()

  let list: Array<{ path: string; within24h?: boolean }> = []
  try {
    const r1 = await fetch(`${url.origin}/_data/withdrawn.json`, { cf: { cacheTtl: 30 } })
    if (r1.ok && r1.headers.get('content-type')?.includes('application/json')) list = await r1.json()
  } catch {}

  if (list.length === 0 && env.WRITER_BASE && env.ADMIN_TOKEN) {
    try {
      const api = new URL('/internal/export/withdrawn', env.WRITER_BASE as string)
      const r2 = await fetch(api.toString(), {
        headers: { 'x-admin-token': env.ADMIN_TOKEN as string },
        cf: { cacheTtl: 15 },
      })
      if (r2.ok) list = await r2.json()
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
        'Content-Type': 'text/plain; charset=utf-8',
      }
    })
  }

  return next()
}

declare global {
  const WRITER_BASE: string
  const ADMIN_TOKEN: string
}
