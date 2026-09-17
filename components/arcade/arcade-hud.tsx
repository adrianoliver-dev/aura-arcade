'use client'

import type { ReactNode } from 'react'

type Props = {
  score: number
  unit?: string
  timeMs: number
  accent: string
  clutch?: boolean
  left?: ReactNode
  right?: ReactNode
}

export function ArcadeHud({ score, unit = 'pts', timeMs, accent, clutch, left, right }: Props) {
  const secs = Math.max(0, Math.min(90, Math.ceil(timeMs / 1000)))
  const danger = clutch || secs <= 8
  const bar = Math.min(100, (secs / 90) * 100)

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div className="absolute inset-x-0 top-0 h-1.5 bg-black/50">
        <div
          className="h-full transition-[width] duration-200"
          style={{ width: `${bar}%`, background: danger ? '#E34B34' : accent, boxShadow: `0 0 12px ${danger ? '#E34B34' : accent}` }}
        />
      </div>

      <div className="absolute left-3 top-[max(3.15rem,calc(env(safe-area-inset-top)+2.55rem))]">
        <div
          className="min-w-[5.5rem] rounded-2xl border bg-black/55 px-3 py-2 backdrop-blur-md"
          style={{ borderColor: `${accent}55`, boxShadow: `0 0 18px ${accent}22` }}
        >
          <p className="font-[family-name:var(--hud-font)] text-[9px] tracking-[0.28em]" style={{ color: accent }}>
            AURA
          </p>
          <p className="text-[2rem] font-black leading-none tabular-nums text-[#F2A021]">{score}</p>
          <p className="text-[10px] uppercase tracking-wide text-white/55">{unit}</p>
          {left}
        </div>
      </div>

      <div className="absolute right-3 top-[max(0.65rem,env(safe-area-inset-top))] text-right">
        <p
          className={`font-[family-name:var(--hud-font)] text-4xl font-black leading-none tabular-nums ${
            danger ? 'text-[#E34B34] drop-shadow-[0_0_12px_#E34B34]' : 'text-white'
          }`}
        >
          {secs}
          <span className="text-lg text-white/50">s</span>
        </p>
        {right}
      </div>
    </div>
  )
}
