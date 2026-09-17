import { ArcadeBack } from '@/components/arcade/back'
import { SalidaGame } from '@/components/salida/salida-game'

export default function SalidaPage() {
  return (
    <div className="relative h-full">
      <ArcadeBack slot="5/5" />
      <SalidaGame />
    </div>
  )
}
