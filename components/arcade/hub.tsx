'use client'

import { useEffect, useState } from 'react'

import { ARCADE_GAMES } from '@/lib/arcade/games'
import { ligaName, loadGameBest } from '@/lib/arcade/liga'
import { heatFromXp, heatLabel, loadXp, missionFor } from '@/lib/arcade/progress'

export function ArcadeHub() {
  const [bests, setBests] = useState<Record<string, number>>({})
  const [xp, setXp] = useState(0)

  useEffect(() => {
    const next: Record<string, number> = {}
    for (const game of ARCADE_GAMES) next[game.id] = loadGameBest(game.id)
    setBests(next)
    setXp(loadXp())
  }, [])

  const heat = heatFromXp(xp)
  const xpInto = xp < 200 ? xp : xp < 600 ? xp - 200 : xp < 1200 ? xp - 600 : xp < 2200 ? xp - 1200 : 400
  const xpNeed = xp < 200 ? 200 : xp < 600 ? 400 : xp < 1200 ? 600 : xp < 2200 ? 1000 : 1
  const pct = Math.min(100, Math.round((xpInto / xpNeed) * 100))

  return (
    <main className="relative flex h-full flex-col items-center overflow-y-auto px-4 pb-8 pt-[max(1.25rem,env(safe-area-inset-top))] [touch-action:pan-y]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,#16B57D22,transparent_55%)]" />
      <p className="relative font-[family-name:var(--hud-font)] text-[11px] tracking-[0.42em] text-[#16B57D]">AURA ARCADE</p>
      <h1 className="relative mt-2 text-center text-4xl font-black tracking-tight">Fexpocruz 2026</h1>
      <p className="relative mt-2 max-w-sm text-center text-base leading-snug text-white/70">
        Cinco juegos. Un pulgar. Ranking de hoy. El calor sube entre rondas.
      </p>

      <div className="relative mt-5 w-full max-w-md rounded-xl border border-[#F2A021]/35 bg-black/40 px-4 py-3">
        <div className="flex items-center justify-between">
          <p className="font-[family-name:var(--hud-font)] text-[11px] tracking-[0.22em] text-[#F2A021]">{heatLabel(heat)}</p>
          <p className="text-[11px] text-white/55">{xp} XP</p>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-[#F2A021]" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-[11px] text-white/45">Jugá otra ronda. El calor no se resetea a los 90s.</p>
      </div>

      <a
        href="/reel"
        className="relative mt-4 inline-flex min-h-11 items-center rounded-full border border-[#F2A021]/40 bg-[#F2A021]/10 px-5 text-[11px] font-semibold tracking-[0.18em] text-[#F2A021]"
      >
        LOOP TV · GAMEPLAY
      </a>

      <ol className="relative mt-6 grid w-full max-w-md gap-3">
        {ARCADE_GAMES.map((game) => {
          const pb = bests[game.id] ?? 0
          const mission = missionFor(game.id, heat)
          return (
            <li key={game.id}>
              <a href={game.href} className="block min-h-11">
                <div
                  className="rounded-2xl border px-4 py-4"
                  style={{ borderColor: `${game.accent}77`, background: `linear-gradient(180deg, ${game.accent}22, #0B0B10)` }}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-[family-name:var(--hud-font)] text-[11px] tracking-[0.22em]" style={{ color: game.accent }}>
                      {game.n}/5 · JUGÁ
                    </p>
                    <p className="text-[11px] text-white/45">{pb > 0 ? `${ligaName(pb)} · ${pb}` : 'Liga 1'}</p>
                  </div>
                  <p className="mt-1 text-xl font-black tracking-tight">{game.title}</p>
                  <p className="mt-1 text-sm text-white/70">{game.blurb}</p>
                  <p className="mt-2 text-[11px]" style={{ color: game.accent }}>
                    Misión: {mission.label}
                  </p>
                  <p className="mt-3 min-h-11 text-sm font-black tracking-[0.14em]" style={{ color: game.accent }}>
                    JUGÁ
                  </p>
                </div>
              </a>
            </li>
          )
        })}
      </ol>
    </main>
  )
}
