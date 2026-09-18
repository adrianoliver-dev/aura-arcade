import { NextResponse } from 'next/server'

import { readLeaderboard } from '@/lib/pulso/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Tres tableros comparables por juego; no mezcla hectáreas con puntos. */
export async function GET() {
  const [humo, pulso, radio] = await Promise.all([
    readLeaderboard('humo'),
    readLeaderboard('anillos'),
    readLeaderboard('radio'),
  ])
  return NextResponse.json(
    { humo: humo.today, pulso: pulso.today, radio: radio.today },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
