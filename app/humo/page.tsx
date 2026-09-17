import { ArcadeBack } from '@/components/arcade/back'
import { HumoGame } from '@/components/humo/humo-game'

export default async function HumoPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>
}) {
  const sp = await searchParams
  return (
    <div className="relative h-full">
      <ArcadeBack slot="2/5" />
      <HumoGame demo={sp.demo === '1'} />
    </div>
  )
}
