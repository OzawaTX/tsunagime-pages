// functions/_middleware.ts
export const onRequest: PagesFunction = async ({ request, env, next }) => {
  const url = new URL(request.url)
  const path = url.pathname

  // 1) これらのパスは素通り（無限ループ防止 & 静的高速化）
  const isStaticExt = /\.[a-z0-9]+$/i.test(path)
  if (
    path === '/ping' ||
    path.startsWith('/_data/') ||
    path.startsWith('/_pagefind/') ||
    path.startsWith('/assets/') ||
    isStaticExt
  ) {
    return next()
  }

  // 2) Writer から撤回リストを取得（3秒タイムアウト）
  let list: Array<{ path: string; within24h?: boolean }> = []
  if (env.WRITER_BASE && env.ADMIN_TOKEN) {
    try {
      const api = new URL('/internal/export/withdrawn', env.WRITER_BASE as string)
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 3000)

      const res = await fetch(api.toString(), {
        headers: { 'x-admin-token': env.ADMIN_TOKEN as string },
        signal: controller.signal,
        cf: { cacheTtl: 15 },
      })
      clearTimeout(timeout)

      if (res.ok) list = await res.json()
    } catch {
      // 失敗時は list=[] のまま通常配信にフォールバック
    }
  }

  // 3) 末尾スラ差を吸収して一致判定
  const norm = (p: string) => (p.endsWith('/') && p !== '/' ? p.slice(0, -1) : p)
  const here = norm(path)
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
      },
    })
  }

  // 通常配信
  return next()
}

declare global {
  const WRITER_BASE: string
  const ADMIN_TOKEN: string
}
