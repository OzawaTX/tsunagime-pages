// functions/posts/[[slug]].ts
export const onRequest: PagesFunction = async ({ request, env }) => {
  const url = new URL(request.url)
  const norm = (p: string) => (p.endsWith('/') && p !== '/' ? p.slice(0, -1) : p)

  // 1) ローカルJSON（/_data/withdrawn.json）を試す
  let list: Array<{ path: string; within24h?: boolean }> = []
  try {
    const res = await fetch(`${url.origin}/_data/withdrawn.json`, { cf: { cacheTtl: 30 } })
    if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
      list = await res.json()
    }
  } catch {}

  // 2) 無ければ Writer から直取得
  if (list.length === 0 && env.WRITER_BASE && env.ADMIN_TOKEN) {
    try {
      const api = new URL('/internal/export/withdrawn', env.WRITER_BASE as string)
      const res = await fetch(api.toString(), {
        headers: { 'x-admin-token': env.ADMIN_TOKEN as string },
        cf: { cacheTtl: 15 },
      })
      if (res.ok) list = await res.json()
    } catch {}
  }

  const here = norm(url.pathname)                       // 例: /posts/4PesQ...
  const hit = list.find(x => norm(x.path) === here)     // 末尾スラ差を吸収

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

  // 該当しなければ静的へ（/posts 下はSPAでもOK）
  return fetch(url.toString())
}

declare global {
  const WRITER_BASE: string
  const ADMIN_TOKEN: string
}
