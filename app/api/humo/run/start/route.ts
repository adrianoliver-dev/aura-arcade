import { MATCH_MS, playSeed } from '@/lib/humo/sim'
import { handleStart } from '@/lib/arcade/run-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  let rematch = 0
  let forced: number | null = null
  try {
    const body = (await request.json()) as { rematch?: unknown; seed?: unknown }
    const n = Number(body.rematch)
    if (Number.isInteger(n) && n >= 0 && n < 40) rematch = n
    const s = Number(body.seed)
    if (Number.isInteger(s) && s > 0 && s <= 0x7fffffff) forced = s
  } catch {
    /* body vacío */
  }
  const seeded = new Request(request.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ seed: forced ?? playSeed(Date.now(), rematch) }),
  })
  return handleStart(seeded, 'humo', MATCH_MS)
}
