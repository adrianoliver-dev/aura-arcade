import { handleFinish } from '@/lib/arcade/run-server'
import { parseMarks, simulateRun } from '@/lib/salida/sim'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  return handleFinish(request, 'salida', (body, seed) => {
    const marks = parseMarks(body.marks)
    if (!marks) return { error: 'marks' }
    const result = simulateRun(seed, marks)
    return { score: result.score, comboMax: result.comboMax }
  })
}
