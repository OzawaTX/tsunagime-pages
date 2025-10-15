export const onRequest: PagesFunction = async ({ request, next }) => {
  // --- MW short-circuit for /posts/__probe --- marker: posts/__probe@mw
  {
    const { pathname } = new URL(request.url);
    if (pathname === "/posts/__probe" || pathname === "/posts/__probe/") {
      return new Response("mw probe ok", {
        status: 200,
        headers: {
          "X-From-Middleware": "yes, short",
          "X-Test-Which": "mw/__probe",
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store"
        }
      });
    }
  }
  const res = await next();
  // --- mw-probe ---
  res.headers.set("X-MW-Version", "mw-probe-20251013-2");
  {
    const { pathname } = new URL(request.url);
    if (pathname.startsWith("/posts/")) {
      res.headers.set("X-Posts-Probe", "hit");
    }
  }
  // --- /mw-probe ---

  // まずは必ず見える共通印（これが無ければデプロイ未反映）
  res.headers.set("X-MW-Version","mw-probe-20251013-1");
  res.headers.set("X-From-Middleware","yes");

  try {
    const { pathname } = new URL(request.url);

    if (pathname.startsWith("/posts/")) {
      // /posts/* に来たことが必ず分かる印
      res.headers.set("X-Posts-Probe","hit");

      // 常にデバッグ用の ETag/LM 候補を打刻（ステータス不問で可視化）
      const rev = res.headers.get("X-Functions-Rev") || "rev-fallback";
      const dbg = "mw-probe";
      const base = (res.headers.get("Last-Modified") || res.headers.get("Date") || new Date().toUTCString());
      res.headers.set("X-ETag-Debug", dbg);
      res.headers.set("X-LM-Debug-Base", base);

      // 2xx のときだけ実際の ETag/LM を補完して 304 判定
      if (res.status >= 200 && res.status < 300) {
        if (!res.headers.get("ETag"))          res.headers.set("ETag", dbg);
        if (!res.headers.get("Last-Modified")) res.headers.set("Last-Modified", base);

        const inm = request.headers.get("If-None-Match");
        const ims = request.headers.get("If-Modified-Since");
        const etag = `W/"${urlSeed}:${rev}"`;
        const lm   = res.headers.get("Last-Modified");

        const matchByEtag = !!(inm && etag && inm.split(",").map(s => s.trim()).includes(etag));
        const matchByTime = !!(ims && lm && Date.parse(ims) >= Date.parse(lm));

        res.headers.set("Vary", [res.headers.get("Vary"), "If-None-Match","If-Modified-Since"].filter(Boolean).join(", "));

        if (matchByEtag || matchByTime) {
          return new Response(null, { status: 304, headers: res.headers });
        }
      } else {
        res.headers.set("X-Why-No-ETag", status=\);
      }
    }
  } catch (e) {
    res.headers.set("X-MW-Probe-Error", "etag-block-error");
  }

  return res;
};





