import Link from 'next/link'

import { ARCADE_GAMES } from '@/lib/arcade/games'

export function ArcadeHub() {
  return (
    <main className="flex h-full flex-col items-center overflow-y-auto px-5 py-8 [touch-action:pan-y]">
      <p className="text-[11px] font-semibold tracking-[0.32em] text-[#16B57D]">AURA ARCADE</p>
      <h1 className="mt-2 text-center text-2xl font-black">Fexpocruz 2026</h1>
      <p className="mt-2 max-w-sm text-center text-sm text-white/60">
        Cinco juegos para probar en el stand. Hoy hay dos. Esto no toca el front de Aura.
      </p>
      <ol className="mt-8 grid w-full max-w-md gap-3">
        {ARCADE_GAMES.map((game) => {
          const card = (
            <div
              className={`rounded-xl border px-4 py-4 ${
                game.status === 'live'
                  ? 'border-[#16B57D]/50 bg-[#16B57D]/10'
                  : 'border-white/10 bg-white/5 text-white/40'
              }`}
            >
              <p className="text-[11px] tracking-[0.2em] text-[#F2A021]">
                {game.n}/5 · {game.status === 'live' ? 'JUGÁ' : 'PRÓX'}
              </p>
              <p className="mt-1 text-lg font-black">{game.title}</p>
              <p className="mt-1 text-sm text-white/70">{game.blurb}</p>
            </div>
          )
          if (game.status !== 'live') {
            return (
              <li key={game.id} aria-disabled>
                {card}
              </li>
            )
          }
          return (
            <li key={game.id}>
              <Link href={game.href} className="block">
                {card}
              </Link>
            </li>
          )
        })}
      </ol>
    </main>
  )
}
