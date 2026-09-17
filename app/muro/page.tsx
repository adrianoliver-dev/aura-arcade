import { ArcadeBack } from '@/components/arcade/back'
import { MuroGame } from '@/components/muro/muro-game'

export default function MuroPage() {
  return (
    <div className="relative h-full">
      <ArcadeBack slot="4/5" />
      <MuroGame />
    </div>
  )
}
