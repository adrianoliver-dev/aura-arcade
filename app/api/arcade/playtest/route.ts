import { mkdirSync, appendFileSync } from 'node:fs'
import { join } from 'node:path'

import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  let body: { game?: string; score?: number; at?: string; demo?: boolean }
  try {
    body = (await request.json()) as { game?: string; score?: number; at?: string; demo?: boolean }
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
  if (!body.game || typeof body.score !== 'number') {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
  const dir = join(process.cwd(), 'docs', 'playtest')
  mkdirSync(dir, { recursive: true })
  const line = JSON.stringify({
    game: body.game,
    score: body.score,
    at: body.at || new Date().toISOString(),
    demo: Boolean(body.demo),
  })
  appendFileSync(join(dir, 'sessions.jsonl'), `${line}\n`, 'utf8')
  return NextResponse.json({ ok: true })
}
