import { ArcadeBack } from '@/components/arcade/back'
import { RadioGame } from '@/components/radio/radio-game'

export default function RadioPage() {
  return (
    <div className="relative h-full">
      <ArcadeBack slot="3/5" />
      <RadioGame />
    </div>
  )
}
