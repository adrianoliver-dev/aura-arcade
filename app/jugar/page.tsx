import { HumoGame } from '@/components/humo/humo-game'
import { parseShareSeed } from '@/lib/humo/sim'

export default async function JugarPage({
  searchParams,
}: {
  searchParams: Promise<{ s?: string }>
}) {
  const sp = await searchParams
  return <HumoGame challengeSeed={parseShareSeed(sp.s)} />
}
