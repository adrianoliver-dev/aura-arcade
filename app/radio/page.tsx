import { ArcadeBack } from '@/components/arcade/back'
import { RadioGame } from '@/components/radio/radio-game'

export default async function RadioPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>
}) {
  const sp = await searchParams
  return (
    <div className="relative h-full">
      <ArcadeBack slot="3/3" />
      <RadioGame demo={sp.demo === '1'} />
    </div>
  )
}
