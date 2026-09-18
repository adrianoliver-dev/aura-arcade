import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'off' }, { status: 404 })
  }
  const name = (request.headers.get('x-filename') || 'clip.webm').replace(/[^a-z0-9._-]+/gi, '')
  if (!name.endsWith('.webm') && !name.endsWith('.mp4') && !name.endsWith('.jpg')) {
    return NextResponse.json({ error: 'name' }, { status: 400 })
  }
  const buf = Buffer.from(await request.arrayBuffer())
  if (buf.byteLength < 1000 || buf.byteLength > 40_000_000) {
    return NextResponse.json({ error: 'size' }, { status: 400 })
  }
  const dir = name.endsWith('.jpg')
    ? path.join(process.cwd(), '.tmp-p2', 'frames', name.replace(/-\d+\.jpg$/, ''))
    : path.join(process.cwd(), 'public', 'trailers', 'final')
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, name), buf)
  return NextResponse.json({ ok: true, name, bytes: buf.byteLength })
}
