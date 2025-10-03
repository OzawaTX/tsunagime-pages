export const onRequest: PagesFunction = async ({ request, env, next }) => {
  const url = new URL(request.url)
  const norm = (p: string) => (p.endsWith('/') && p !== '/' ? p.slice(0, -1) : p)
  const here = norm(url.pathname)

  // 1) まずローカル JSON（/_data/withdrawn.json）を試す
  let list: Array<{ path: string; within24h?: boolean }> = []
  try {
    const res = await fetch(`${url.origin}/_data/withdrawn.json`, { cf: { cacheTtl: 30 } })
    if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
      list = await res.json()
    }
  } catch {}

  // 2) 無ければ Writer から直取得（環境変数を使う）
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

  // 3) パス一致（末尾スラ差を吸収）
  const hit = list.find(x => norm(x.path) === here)
  if (hit) {
    const headers = new Headers({
      'Cache-Control': hit.within24h ? 'no-store' : 'public, max-age=60',
      'X-Robots-Tag': 'noai, noimageai',
      'tdm-reservation': '1',
      'X-Content-Type-Options': 'nosniff',
      'Content-Type': 'text/plain; charset=utf-8',
    })
    return new Response('', { status: 410, headers })
  }

  // 4) 通常レスポンス（共通ヘッダ）
  const res = await next()
  res.headers.set('X-Robots-Tag', 'noai, noimageai')
  res.headers.set('tdm-reservation', '1')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  return res
}

declare global {
  const WRITER_BASE: string
  const ADMIN_TOKEN: string
}
