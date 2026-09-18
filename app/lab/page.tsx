import Link from 'next/link'

import { LabGames } from '@/components/arcade/lab-games'
import { SalaActions } from '@/components/arcade/sala-actions'
import { SalaAtmosphere } from '@/components/arcade/sala-atmosphere'

export default function LabPage() {
  return (
    <main className="relative flex h-full flex-col overflow-hidden bg-[#0D1210] px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <SalaAtmosphere />
      <header className="relative z-10 flex items-center justify-between gap-3">
        <Link
          href="/"
          className="flex min-h-11 w-fit items-center rounded-full border border-[#F4E7CF]/35 bg-[#0D1210]/55 px-3 text-xs tracking-[0.16em] text-[#F4E7CF] backdrop-blur-sm"
        >
          ← INICIO
        </Link>
        <SalaActions />
      </header>
      <div className="relative z-10 mt-auto">
        <p className="text-xs uppercase tracking-[0.25em] text-[#19C37D]">AURA ARCADE</p>
        <h1 className="font-[family-name:var(--font-display)] mt-2 text-5xl text-[#F4E7CF]">Sala Aura</h1>
        <p className="mt-2 max-w-sm text-[#F4E7CF]/75">Tres retos cortos. Elegí uno, jugá una ronda y dejá tu marca.</p>
        <p className="mt-3 font-[family-name:var(--hud-font)] text-[10px] tracking-[.2em] text-[#F2A021]">JUGÁ · SUPERÁ UNA MARCA · COMPARTÍ EL RETO</p>
      </div>
      <LabGames />
    </main>
  )
}
