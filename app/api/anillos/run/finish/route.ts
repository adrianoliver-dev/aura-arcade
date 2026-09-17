import { NextResponse } from 'next/server'

import { sanitizeAlias, sanitizeTag } from '@/lib/pulso/alias'
import { verifyRunToken } from '@/lib/pulso/hmac'
import { clientIp, rateLimit } from '@/lib/pulso/rate-limit'
import { simulateRun } from '@/lib/pulso/sim'
import { markRunUsed, runWasUsed, saveScore, updateAlias } from '@/lib/pulso/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Body = {
  token?: string
  taps?: unknown
  alias?: string
  tag?: string
  aliasOnly?: boolean
}

function parseTaps(raw: unknown): number[] | null {
  if (!Array.isArray(raw) || raw.length > 240) return null
  const out: number[] = []
  for (const item of raw) {
    const n = Number(item)
    if (!Number.isFinite(n)) return null
    out.push(n)
  }
  return out
}

export async function POST(request: Request) {
  const ip = clientIp(request)
  if (!rateLimit(`anillos-finish:${ip}`, 60, 60_000)) {
    return NextResponse.json({ error: 'rate' }, { status: 429 })
  }

  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ error: 'json' }, { status: 400 })
  }

  const payload = typeof body.token === 'string' ? verifyRunToken(body.token) : null
  if (!payload) {
    return NextResponse.json({ error: 'token' }, { status: 400 })
  }

  const alias = sanitizeAlias(body.alias, payload.runId)
  const tag = sanitizeTag(body.tag)
  const used = await runWasUsed(payload.runId)

  if (body.aliasOnly || used) {
    if (!used) {
      return NextResponse.json({ error: 'not_finished' }, { status: 409 })
    }
    const updated = await updateAlias(payload.runId, alias, tag, 'anillos')
    if (!updated) {
      return NextResponse.json({ error: 'unknown_run' }, { status: 409 })
    }
    return NextResponse.json({
      ok: true,
      updated: true,
      score: updated.score,
      alias: updated.alias,
      tag: updated.tag,
    })
  }

  const taps = parseTaps(body.taps)
  if (!taps) {
    return NextResponse.json({ error: 'taps' }, { status: 400 })
  }

  const result = simulateRun(payload.seed, taps)
  const first = await markRunUsed(payload.runId, payload.seed, result.score)
  if (!first) {
    return NextResponse.json({ error: 'duplicate' }, { status: 409 })
  }

  const board = await saveScore(
    {
      id: payload.runId,
      alias,
      tag,
      score: result.score,
      comboMax: result.comboMax,
      at: Date.now(),
    },
    'anillos',
  )

  return NextResponse.json({
    ok: true,
    score: result.score,
    comboMax: result.comboMax,
    kills: result.kills,
    rank: board.rank,
    total: board.total,
    gap: board.gap,
    today: board.today,
    fair: board.fair,
    alias: board.alias,
    tag,
  })
}
