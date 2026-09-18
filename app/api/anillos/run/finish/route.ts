import { handleFinish } from '@/lib/arcade/run-server'
import { parseTaps, simulateRun } from '@/lib/pulso/sim'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  return handleFinish(request, 'anillos', (body, seed) => {
    const taps = parseTaps(body.taps)
    if (!taps) return { error: 'taps' }
    const result = simulateRun(seed, taps)
    return { score: result.score, comboMax: result.comboMax, kills: result.kills }
  })
}
