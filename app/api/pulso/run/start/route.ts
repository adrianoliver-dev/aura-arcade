import { MATCH_MS } from '@/lib/pulso/sim'
import { handleStart } from '@/lib/arcade/run-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  return handleStart(request, 'anillos', MATCH_MS)
}
