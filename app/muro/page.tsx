import { ArcadeBack } from '@/components/arcade/back'
import { MuroGame } from '@/components/muro/muro-game'

export default async function MuroPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>
}) {
  const sp = await searchParams
  return (
    <div className="relative h-full">
      <ArcadeBack slot="4/5" />
      <MuroGame demo={sp.demo === '1'} />
    </div>
  )
}
