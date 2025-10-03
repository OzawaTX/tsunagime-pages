// scripts/prune-withdrawn.mjs
import fs from "node:fs/promises";
import path from "node:path";

// 環境変数（Pages の Production に設定済みのを使用）
const WRITER_BASE = process.env.WRITER_BASE;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

// public 配下に生成している前提（/posts/<id>/index.html）
const PUBLIC_DIR = path.resolve("public");

function norm(p) {
  if (!p.startsWith("/")) p = "/" + p;
  return p.endsWith("/") && p !== "/" ? p.slice(0, -1) : p;
}

async function main() {
  if (!WRITER_BASE || !ADMIN_TOKEN) {
    console.error("WRITER_BASE or ADMIN_TOKEN is not set");
    process.exit(0); // 変数が無い環境では何もしないで成功扱い
  }

  // 撤回リストを取得
  const api = new URL("/internal/export/withdrawn", WRITER_BASE).toString();
  const res = await fetch(api, { headers: { "x-admin-token": ADMIN_TOKEN } });
  if (!res.ok) {
    console.error("failed to fetch withdrawn:", res.status, await res.text());
    process.exit(1);
  }
  /** @type {{path:string, within24h?:boolean}[]} */
  const list = await res.json();
  if (!Array.isArray(list) || list.length === 0) {
    console.log("no withdrawn entries");
    return;
  }

  // 対象ファイルを削除（/posts/ID/ と /posts/ID/index.html の両方を試す）
  let removed = 0;
  for (const item of list) {
    const p = norm(item.path);                   // 例: /posts/abc123
    const dir = path.join(PUBLIC_DIR, "." + p);  // public/posts/abc123
    const idx = path.join(dir, "index.html");    // public/posts/abc123/index.html
    const file = path.join(PUBLIC_DIR, "." + p + ".html"); // public/posts/abc123.html（もしこの形なら）

    // index.html の形
    try {
      await fs.rm(idx, { force: true });
      removed++;
      console.log("removed:", idx);
    } catch {}

    // ディレクトリごと（念のため）
    try {
      await fs.rm(dir, { recursive: true, force: true });
      console.log("rmdir:", dir);
    } catch {}

    // 直置き .html の形
    try {
      await fs.rm(file, { force: true });
      removed++;
      console.log("removed:", file);
    } catch {}
  }

  console.log(`done. removed files: ${removed}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
