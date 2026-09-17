import { NextResponse } from 'next/server'

import { clientIp, rateLimit } from '@/lib/pulso/rate-limit'
import { recordInterest } from '@/lib/pulso/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const ip = clientIp(request)
  if (!rateLimit(`interest:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: 'rate' }, { status: 429 })
  }

  let source = 'icp'
  try {
    const body = (await request.json()) as { source?: string }
    if (typeof body.source === 'string' && body.source.trim()) {
      source = body.source.trim().slice(0, 40)
    }
  } catch {
    /* ping vacío sigue siendo válido */
  }

  const ping = await recordInterest(source)
  return NextResponse.json({ ok: true, ping })
}
