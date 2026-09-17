import { handleStart } from '@/lib/arcade/run-server'
import { MATCH_MS } from '@/lib/radio/sim'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  return handleStart(request, 'radio', MATCH_MS)
}
