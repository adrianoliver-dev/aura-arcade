import { ArcadeBack } from '@/components/arcade/back'
import { HumoGame } from '@/components/humo/humo-game'

export default function HumoPage() {
  return (
    <div className="relative h-full">
      <ArcadeBack slot="2/5" />
      <HumoGame />
    </div>
  )
}
