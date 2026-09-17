import { NextResponse } from 'next/server'

import { sanitizeAlias, sanitizeTag } from '@/lib/pulso/alias'
import { issueRunToken, newRunId, verifyRunToken } from '@/lib/pulso/hmac'
import { clientIp, rateLimit } from '@/lib/pulso/rate-limit'
import { markRunUsed, runWasUsed, saveScore, updateAlias, type ArcadeGameId } from '@/lib/pulso/store'

export async function handleStart(request: Request, slug: string, matchMs: number) {
  const ip = clientIp(request)
  if (!rateLimit(`${slug}-start:${ip}`, 40, 60_000)) {
    return NextResponse.json({ error: 'rate' }, { status: 429 })
  }

  try {
    let seed = (Math.floor(Math.random() * 0x7fffffff) + 1) | 0
    try {
      const text = await request.text()
      if (text) {
        const body = JSON.parse(text) as { seed?: unknown }
        const s = typeof body.seed === 'number' ? body.seed : Number(body.seed)
        if (Number.isInteger(s) && s > 0 && s <= 0x7fffffff) seed = s | 0
      }
    } catch {
      /* seed aleatorio */
    }
    const runId = newRunId()
    const issuedAt = Date.now()
    const token = issueRunToken({ runId, seed, issuedAt })
    return NextResponse.json({ runId, seed, token, issuedAt, matchMs })
  } catch {
    return NextResponse.json({ error: 'start_unavailable' }, { status: 503 })
  }
}

export async function handleFinish(
  request: Request,
  game: ArcadeGameId,
  play: (body: Record<string, unknown>, seed: number) => { score: number; comboMax: number } | { error: string },
) {
  const ip = clientIp(request)
  if (!rateLimit(`${game}-finish:${ip}`, 60, 60_000)) {
    return NextResponse.json({ error: 'rate' }, { status: 429 })
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'json' }, { status: 400 })
  }

  const payload = typeof body.token === 'string' ? verifyRunToken(body.token) : null
  if (!payload) {
    return NextResponse.json({ error: 'token' }, { status: 400 })
  }

  const alias = sanitizeAlias(typeof body.alias === 'string' ? body.alias : undefined, payload.runId)
  const tag = sanitizeTag(typeof body.tag === 'string' ? body.tag : undefined)
  const used = await runWasUsed(payload.runId)

  if (body.aliasOnly || used) {
    if (!used) {
      return NextResponse.json({ error: 'not_finished' }, { status: 409 })
    }
    const updated = await updateAlias(payload.runId, alias, tag, game)
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

  const result = play(body, payload.seed)
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

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
    game,
  )

  return NextResponse.json({
    ok: true,
    score: result.score,
    comboMax: result.comboMax,
    rank: board.rank,
    total: board.total,
    gap: board.gap,
    today: board.today,
    fair: board.fair,
    alias: board.alias,
    tag,
  })
}
