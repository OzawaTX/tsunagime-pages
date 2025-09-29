import fs from 'node:fs/promises'
import path from 'node:path'

const BASE = process.env.WRITER_BASE
const TOKEN = process.env.ADMIN_TOKEN

async function main() {
  if (!BASE || !TOKEN) throw new Error('WRITER_BASE or ADMIN_TOKEN is missing')

  const url = new URL('/internal/export/withdrawn', BASE)
  const res = await fetch(url, { headers: { 'x-admin-token': TOKEN } })
  if (!res.ok) throw new Error(`fetch withdrawn failed: ${res.status}`)
  const list = await res.json()

  const outDir = path.join(process.cwd(), 'public', '_data')
  await fs.mkdir(outDir, { recursive: true })
  await fs.writeFile(path.join(outDir, 'withdrawn.json'), JSON.stringify(list), 'utf8')
  console.log(`wrote ${list.length} withdrawn paths`)
}

main().catch((e) => { console.error(e); process.exit(1) })
