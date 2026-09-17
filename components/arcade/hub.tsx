'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { ARCADE_GAMES } from '@/lib/arcade/games'
import { ligaName, loadGameBest } from '@/lib/arcade/liga'

export function ArcadeHub() {
  const [bests, setBests] = useState<Record<string, number>>({})

  useEffect(() => {
    const next: Record<string, number> = {}
    for (const game of ARCADE_GAMES) next[game.id] = loadGameBest(game.id)
    setBests(next)
  }, [])

  return (
    <main className="flex h-full flex-col items-center overflow-y-auto px-5 py-8 [touch-action:pan-y]">
      <p className="text-[11px] font-semibold tracking-[0.32em] text-[#16B57D]">AURA ARCADE</p>
      <h1 className="mt-2 text-center text-3xl font-black">Fexpocruz 2026</h1>
      <p className="mt-2 max-w-sm text-center text-sm text-white/60">
        Cinco juegos. Se entienden en un segundo. 90 segundos de pelea. Ranking de hoy.
      </p>
      <Link
        href="/loop"
        className="mt-4 rounded-full border border-[#F2A021]/40 bg-[#F2A021]/10 px-4 py-2 text-[11px] font-semibold tracking-[0.18em] text-[#F2A021]"
      >
        LOOP TV · TRAILERS
      </Link>
      <ol className="mt-6 grid w-full max-w-md gap-3">
        {ARCADE_GAMES.map((game) => {
          const pb = bests[game.id] ?? 0
          return (
            <li key={game.id}>
              <Link href={game.href} className="block">
                <div
                  className="rounded-xl border px-4 py-4"
                  style={{ borderColor: `${game.accent}66`, background: `${game.accent}14` }}
                >
                  <p className="text-[11px] tracking-[0.2em]" style={{ color: game.accent }}>
                    {game.n}/5 · JUGÁ
                  </p>
                  <p className="mt-1 text-lg font-black">{game.title}</p>
                  <p className="mt-1 text-sm text-white/70">{game.blurb}</p>
                  {pb > 0 ? (
                    <p className="mt-2 text-[11px] text-white/50">
                      {ligaName(pb)} · {pb}
                    </p>
                  ) : (
                    <p className="mt-2 text-[11px] text-white/40">Liga 1 · primer round</p>
                  )}
                </div>
              </Link>
            </li>
          )
        })}
      </ol>
    </main>
  )
}
