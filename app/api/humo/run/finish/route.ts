import { parseStrokes, simulateRun } from '@/lib/humo/sim'
import { handleFinish } from '@/lib/arcade/run-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  return handleFinish(request, 'humo', (body, seed) => {
    const strokes = parseStrokes(body.strokes)
    if (!strokes) return { error: 'strokes' }
    const result = simulateRun(seed, strokes)
    return {
      score: result.hectares,
      comboMax: result.efficiency,
      hectares: result.hectares,
      efficiency: result.efficiency,
      medal: result.medal,
      rankScore: result.rankScore,
      arrived: result.savedByIncident.filter((row) => row.arrived).length,
    }
  })
}
