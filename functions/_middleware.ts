// functions/_middleware.ts
export const onRequest: PagesFunction = async ({ request, env, next }) => {
  const url = new URL(request.url)
  const norm = (p: string) => (p.endsWith('/') && p !== '/' ? p.slice(0, -1) : p)
  const here = norm(url.pathname)

  // /ping は確認用なので素通り
  if (here === '/ping') return next()

  // 1) ローカル JSON（/_data/withdrawn.json）を試す
  let list: Array<{ path: string; within24h?: boolean }> = []
  try {
    const r1 = await fetch(`${url.origin}/_data/withdrawn.json`, { cf: { cacheTtl: 30 } })
    if (r1.ok && r1.headers.get('content-type')?.includes('application/json')) {
      list = await r1.json()
    }
  } catch {}

  // 2) 無ければ Writer から直取得（環境変数を使用）
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

  // 3) 一致すれば 410
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
