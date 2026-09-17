import { handleFinish } from '@/lib/arcade/run-server'
import { parseDecisions, simulateRun } from '@/lib/radio/sim'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  return handleFinish(request, 'radio', (body, seed) => {
    const decisions = parseDecisions(body.decisions)
    if (!decisions) return { error: 'decisions' }
    const result = simulateRun(seed, decisions)
    return { score: result.score, comboMax: result.comboMax }
  })
}
