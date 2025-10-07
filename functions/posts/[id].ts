// functions/posts/[id].ts
export const onRequest: PagesFunction = async (ctx) => {
  const { request } = ctx;
  const url = new URL(request.url);
  const id = ctx.params?.id as string | undefined;

  const addCommon = (res: Response, reason?: string) => {
    const h = new Headers(res.headers);
    h.set('X-From-Posts-Function', 'yes');
    if (reason) h.set('X-Reason', reason);
    h.set('X-Robots-Tag', 'noai, noimageai');
    h.set('tdm-reservation', '1');
    return new Response(res.body, { status: res.status, headers: h });
  };

  if (!id) {
    return addCommon(new Response('Bad Request', { status: 400 }), 'no_id');
  }

  // Writer の status を参照
  const WRITER = 'https://tsunagime-writer.hidemasa-ozawa.workers.dev';

  try {
    const r = await fetch(`${WRITER}/posts/${id}/status`, { cf: { cacheTtl: 0 } });

    if (r.status === 404) {
      // プローブ用の「存在しないIDなら 418」
      return addCommon(new Response(`probe ok: ${id}`, { status: 418 }), 'probe_file_route');
    }

    const data = await r.json().catch(() => null);

    // family_only は常に非公開（404）
    if (data?.ok && data.visibility === 'family_only') {
      return addCommon(new Response('Not Found', { status: 404 }), 'family_only');
    }

    // family_early で未公開は 404
    if (data?.ok && data.visibility === 'family_early' && data.status !== 'published') {
      return addCommon(new Response('Not Found', { status: 404 }), 'family_early_prepub');
    }

    // withdrawn は 410（撤回24h以内は no-store）
    if (data?.ok && data.status === 'withdrawn') {
      let cache = 'public, max-age=60';
      if (data.withdrawn_at) {
        const w = new Date(data.withdrawn_at).getTime();
        if (!Number.isNaN(w) && (Date.now() - w) <= 24*60*60*1000) cache = 'no-store';
      }
      const res = new Response('Gone', { status: 410, headers: { 'Cache-Control': cache } });
      return addCommon(res, 'withdrawn');
    }

    // ここまで来たら「公開OK」→ 静的へフォールバック
    const nextRes = await ctx.next();
    const h = new Headers(nextRes.headers);
    h.set('Cache-Control', 'public, max-age=60');
    const res = new Response(nextRes.body, { status: nextRes.status, headers: h });
    return addCommon(res, 'public_ok');
  } catch (e) {
    return addCommon(new Response('Service Unavailable', { status: 503 }), 'writer_fetch_error');
  }
};
