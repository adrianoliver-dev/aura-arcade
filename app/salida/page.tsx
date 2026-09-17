import { ArcadeBack } from '@/components/arcade/back'
import { SalidaGame } from '@/components/salida/salida-game'

export default async function SalidaPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>
}) {
  const sp = await searchParams
  return (
    <div className="relative h-full">
      <ArcadeBack slot="5/5" />
      <SalidaGame demo={sp.demo === '1'} />
    </div>
  )
}
