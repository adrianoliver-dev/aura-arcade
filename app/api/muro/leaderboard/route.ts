import { NextResponse } from 'next/server'

import { readLeaderboard } from '@/lib/pulso/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const board = await readLeaderboard('muro')
  return NextResponse.json(board, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
