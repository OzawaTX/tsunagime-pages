export const onRequest: PagesFunction = async ({ request, next }) => {
  const url = new URL(request.url)

  // 撤回リストを取得（キャッシュ60秒）
  let list: Array<{ path: string; within24h?: boolean }> = []
  try {
    const res = await fetch(`${url.origin}/_data/withdrawn.json`, { cf: { cacheTtl: 60 } })
    if (res.ok) list = await res.json()
  } catch {}

  const hit = list.find(x => x.path === url.pathname)
  if (hit) {
    const headers = new Headers({
      'Cache-Control': hit.within24h ? 'no-store' : 'public, max-age=60',
      'X-Robots-Tag': 'noai, noimageai',
      'tdm-reservation': '1',
      'X-Content-Type-Options': 'nosniff',
      'Content-Type': 'text/plain; charset=utf-8'
    })
    return new Response('', { status: 410, headers })
  }

  const res = await next()
  res.headers.set('X-Robots-Tag', 'noai, noimageai')
  res.headers.set('tdm-reservation', '1')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  return res
}
