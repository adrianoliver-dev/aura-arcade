import { ArcadeBack } from '@/components/arcade/back'
import { RadioGameV2 } from '@/components/radio/radio-game-v2'

export default async function RadioPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>
}) {
  const sp = await searchParams
  return (
    <div className="relative h-full">
      <ArcadeBack slot="3/3" />
      <RadioGameV2 demo={sp.demo === '1'} standalone />
    </div>
  )
}
