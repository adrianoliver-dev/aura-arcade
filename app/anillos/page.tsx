import { ArcadeBack } from '@/components/arcade/back'
import { PulsoGame } from '@/components/pulso/pulso-game'

export default function AnillosPage() {
  return (
    <div className="relative h-full">
      <ArcadeBack slot="1/5" />
      <PulsoGame />
    </div>
  )
}
