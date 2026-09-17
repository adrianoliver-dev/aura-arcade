import { ArcadeBack } from '@/components/arcade/back'
import { PulsoGame } from '@/components/pulso/pulso-game'

export default async function AnillosPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>
}) {
  const sp = await searchParams
  return (
    <div className="relative h-full">
      <ArcadeBack slot="1/5" />
      <PulsoGame demo={sp.demo === '1'} />
    </div>
  )
}
