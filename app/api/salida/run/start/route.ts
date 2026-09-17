import { handleStart } from '@/lib/arcade/run-server'
import { MATCH_MS } from '@/lib/salida/sim'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  return handleStart(request, 'salida', MATCH_MS)
}
