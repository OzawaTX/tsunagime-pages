export const onRequest: PagesFunction = async (context) => {
  const { request, next } = context;
  const url = new URL(request.url);

  // 静的系は素通り
  const ext = url.pathname.match(/\.(?:css|js|mjs|map|png|jpe?g|webp|avif|gif|ico|svg|txt|json|xml|pdf|woff2?)$/i);
  if (url.pathname.startsWith('/_pagefind') || url.pathname.startsWith('/_data') || url.pathname === '/ping' || ext) {
    const res = await next();
    res.headers.set('X-Robots-Tag', 'noai, noimageai');
    res.headers.set('tdm-reservation', '1');
    return res;
  }

  // /posts/<ID> → 末尾スラ無しは301で付与
  const noSlash = url.pathname.match(/^\/posts\/([A-Za-z0-9_\-]+)$/);
  if (noSlash) {
    url.pathname = `/posts/${noSlash[1]}/`;
    return new Response(null, { status: 301, headers: { Location: url.toString() } });
  }

  // /posts/<ID>/ の公開制御
  const m = url.pathname.match(/^\/posts\/([A-Za-z0-9_\-]+)\/$/);
  if (m) {
    const id = m[1];
    const WRITER = 'https://tsunagime-writer.hidemasa-ozawa.workers.dev';

    let data: any = null;
    try {
      const r = await fetch(`${WRITER}/posts/${id}/status`, { cf: { cacheTtl: 0 } });
      if (r.status === 404) return new Response('Not Found', { status: 404 });
      data = await r.json();
    } catch {
      return new Response('Service Unavailable', { status: 503 });
    }

    // 撤回は410（撤回から24h以内はno-store）
    if (data?.ok && data.status === 'withdrawn') {
      let cache = 'public, max-age=60';
      if (data.withdrawn_at) {
        const w = new Date(data.withdrawn_at).getTime();
        if (!Number.isNaN(w) && (Date.now() - w) <= 24*60*60*1000) cache = 'no-store';
      }
      return new Response('Gone', {
        status: 410,
        headers: { 'X-Robots-Tag': 'noai, noimageai', 'tdm-reservation': '1', 'Cache-Control': cache }
      });
    }

    // family_only は常に非露出
    if (data?.ok && data.visibility === 'family_only') {
      return new Response('Not Found', {
        status: 404,
        headers: { 'X-Robots-Tag': 'noai, noimageai', 'tdm-reservation': '1', 'Cache-Control': 'public, max-age=60' }
      });
    }

    // それ以外は通常配信（ヘッダ付与）
    const res = await next();
    res.headers.set('X-Robots-Tag', 'noai, noimageai');
    res.headers.set('tdm-reservation', '1');
    res.headers.set('Cache-Control', 'public, max-age=60');
    return res;
  }

  const res = await next();
  res.headers.set('X-Robots-Tag', 'noai, noimageai');
  res.headers.set('tdm-reservation', '1');
  return res;
};
