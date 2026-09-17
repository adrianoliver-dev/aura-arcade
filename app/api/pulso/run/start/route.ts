import { NextResponse } from 'next/server'

import { MATCH_MS } from '@/lib/humo/sim'
import { issueRunToken, newRunId } from '@/lib/pulso/hmac'
import { clientIp, rateLimit } from '@/lib/pulso/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const ip = clientIp(request)
  if (!rateLimit(`start:${ip}`, 40, 60_000)) {
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
      /* body vacío o inválido: seed aleatorio */
    }
    const runId = newRunId()
    const issuedAt = Date.now()
    const token = issueRunToken({ runId, seed, issuedAt })
    return NextResponse.json({ runId, seed, token, issuedAt, matchMs: MATCH_MS })
  } catch {
    return NextResponse.json({ error: 'start_unavailable' }, { status: 503 })
  }
}
