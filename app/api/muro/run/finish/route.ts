import { handleFinish } from '@/lib/arcade/run-server'
import { parseWalls, simulateRun } from '@/lib/muro/sim'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  return handleFinish(request, 'muro', (body, seed) => {
    const walls = parseWalls(body.walls)
    if (!walls) return { error: 'walls' }
    const result = simulateRun(seed, walls)
    return { score: result.score, comboMax: result.comboMax }
  })
}
