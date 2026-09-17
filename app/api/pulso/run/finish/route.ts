import { NextResponse } from 'next/server'

import { parseStrokes, simulateRun } from '@/lib/humo/sim'
import { sanitizeAlias, sanitizeTag } from '@/lib/pulso/alias'
import { verifyRunToken } from '@/lib/pulso/hmac'
import { clientIp, rateLimit } from '@/lib/pulso/rate-limit'
import { markRunUsed, runWasUsed, saveScore, updateAlias } from '@/lib/pulso/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Body = {
  token?: string
  strokes?: unknown
  alias?: string
  tag?: string
  aliasOnly?: boolean
}

export async function POST(request: Request) {
  const ip = clientIp(request)
  if (!rateLimit(`finish:${ip}`, 60, 60_000)) {
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
    const updated = await updateAlias(payload.runId, alias, tag)
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

  const strokes = parseStrokes(body.strokes)
  if (!strokes) {
    return NextResponse.json({ error: 'strokes' }, { status: 400 })
  }

  const result = simulateRun(payload.seed, strokes)
  const first = await markRunUsed(payload.runId, payload.seed, result.hectares)
  if (!first) {
    return NextResponse.json({ error: 'duplicate' }, { status: 409 })
  }

  const arrived = result.savedByIncident.filter((row) => row.arrived).length
  const board = await saveScore({
    id: payload.runId,
    alias,
    tag,
    score: result.hectares,
    comboMax: result.efficiency,
    at: Date.now(),
  })

  return NextResponse.json({
    ok: true,
    score: result.hectares,
    hectares: result.hectares,
    comboMax: result.efficiency,
    efficiency: result.efficiency,
    kills: arrived,
    arrived,
    rankScore: result.rankScore,
    rank: board.rank,
    total: board.total,
    gap: board.gap,
    today: board.today,
    fair: board.fair,
    alias: board.alias,
    tag,
  })
}
