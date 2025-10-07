export const onRequest: PagesFunction = async (ctx) => {
  const { request, next } = ctx;
  const url = new URL(request.url);

  // ① /posts/<id>（末尾スラ無し）は 301 で /posts/<id>/ へ
  const mNo = url.pathname.match(/^\/posts\/([A-Za-z0-9_\-]+)$/);
  if (mNo) {
    url.pathname = `/posts/${mNo[1]}/`;
    return new Response(null, {
      status: 301,
      headers: {
        Location: url.toString(),
        "X-From-Posts-Function": "yes",
        "X-Reason": "add_trailing_slash",
        "X-Robots-Tag": "noai, noimageai",
        "tdm-reservation": "1",
      },
    });
  }

  // ② /posts/<id>/ のときだけ、公開可否を判定
  const m = url.pathname.match(/^\/posts\/([A-Za-z0-9_\-]+)\/$/);
  if (!m) {
    const passthrough = await next();
    passthrough.headers.set("X-Robots-Tag", "noai, noimageai");
    passthrough.headers.set("tdm-reservation", "1");
    return passthrough;
  }
  const id = m[1];

  const WRITER = "https://tsunagime-writer.hidemasa-ozawa.workers.dev";

  let data: any = null;
  try {
    const r = await fetch(`${WRITER}/posts/${id}/status`, { cf: { cacheTtl: 0 } });
    if (r.status === 404) {
      return new Response("Not Found", {
        status: 404,
        headers: {
          "X-From-Posts-Function": "yes",
          "X-Reason": "writer_not_found",
          "X-Robots-Tag": "noai, noimageai",
          "tdm-reservation": "1",
          "Cache-Control": "public, max-age=60",
        },
      });
    }
    data = await r.json();
  } catch {
    return new Response("Service Unavailable", {
      status: 503,
      headers: {
        "X-From-Posts-Function": "yes",
        "X-Reason": "writer_unavailable",
        "X-Robots-Tag": "noai, noimageai",
        "tdm-reservation": "1",
      },
    });
  }

  // 撤回は 410
  if (data?.ok && data.status === "withdrawn") {
    let cache = "public, max-age=60";
    if (data.withdrawn_at) {
      const w = new Date(data.withdrawn_at).getTime();
      if (!Number.isNaN(w) && (Date.now() - w) <= 24 * 60 * 60 * 1000) cache = "no-store";
    }
    return new Response("Gone", {
      status: 410,
      headers: {
        "X-From-Posts-Function": "yes",
        "X-Reason": "withdrawn",
        "X-Robots-Tag": "noai, noimageai",
        "tdm-reservation": "1",
        "Cache-Control": cache,
      },
    });
  }

  // family_only は常に非露出
  if (data?.ok && data.visibility === "family_only") {
    return new Response("Not Found", {
      status: 404,
      headers: {
        "X-From-Posts-Function": "yes",
        "X-Reason": "family_only",
        "X-Robots-Tag": "noai, noimageai",
        "tdm-reservation": "1",
        "Cache-Control": "public, max-age=60",
      },
    });
  }

  // family_early かつ未公開は404
  if (data?.ok && data.visibility === "family_early" && data.status !== "published") {
    return new Response("Not Found", {
      status: 404,
      headers: {
        "X-From-Posts-Function": "yes",
        "X-Reason": "family_early_prepub",
        "X-Robots-Tag": "noai, noimageai",
        "tdm-reservation": "1",
        "Cache-Control": "public, max-age=60",
      },
    });
  }

  // 公開OK → 静的を返す（ヘッダ付け）
  const res = await next();
  res.headers.set("X-From-Posts-Function", "yes");
  res.headers.set("X-Reason", "public_ok");
  res.headers.set("X-Robots-Tag", "noai, noimageai");
  res.headers.set("tdm-reservation", "1");
  res.headers.set("Cache-Control", "public, max-age=60");
  return res;
};
