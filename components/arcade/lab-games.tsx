'use client'

import Link from 'next/link'
import { useSyncExternalStore } from 'react'

import { loadGameBest } from '@/lib/arcade/liga'

const GAMES = [
  { id: 'humo', href: '/jugar', title: 'ANTES DEL HUMO', meta: '40 s · trazá la respuesta', tone: 'border-[#19C37D] bg-[#19C37D]/12', unit: 'ha' },
  { id: 'anillos', href: '/lab/anillos', title: 'PULSO', meta: 'Ritmo · frená las brasas', tone: 'border-[#ff9f1c]/45 bg-[#ff9f1c]/8', unit: 'pts' },
  { id: 'radio', href: '/lab/radio', title: 'RADIO ROJA', meta: 'Decisión · elegí la orden', tone: 'border-[#ff5a36]/45 bg-[#ff5a36]/8', unit: 'pts' },
] as const

function subscribe(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange)
  return () => window.removeEventListener('storage', onStoreChange)
}

function bestSnapshot(id: string) {
  return loadGameBest(id)
}

function serverBest() {
  return 0
}

export function LabGames() {
  return (
    <ul className="relative z-10 grid gap-2">
      {GAMES.map((game) => (
        <LabGameCard key={game.href} game={game} />
      ))}
    </ul>
  )
}

function LabGameCard({ game }: { game: (typeof GAMES)[number] }) {
  const best = useSyncExternalStore(subscribe, () => bestSnapshot(game.id), serverBest)
  return (
    <li>
      <Link
        href={game.href}
        className={`flex min-h-16 items-center justify-between rounded-2xl border px-4 text-[#F4E7CF] ${game.tone}`}
      >
        <span>
          <span className="block font-[family-name:var(--font-display)] text-xl">{game.title}</span>
          <span className="mt-0.5 block text-xs text-[#F4E7CF]/65">{game.meta}</span>
          {best > 0 ? (
            <span className="mt-0.5 block text-xs tabular-nums text-[#FF9F1C]">
              Mejor {best} {game.unit}
            </span>
          ) : null}
        </span>
        <span className="rounded-full bg-[#F4E7CF]/10 px-2 py-1 text-[10px] tracking-[0.14em] text-[#F4E7CF]">JUGÁ</span>
      </Link>
    </li>
  )
}
