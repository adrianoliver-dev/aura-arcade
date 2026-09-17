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
  const secs = Math.max(0, Math.ceil(timeMs / 1000))
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div
        className="mx-auto flex max-w-lg items-start justify-between rounded-lg border bg-black/55 px-3 py-2 backdrop-blur-sm"
        style={{ borderColor: clutch ? '#E34B34' : `${accent}55`, boxShadow: clutch ? '0 0 24px #E34B3488' : `0 0 18px ${accent}22` }}
      >
        <div className="min-w-0">
          <p className="font-[family-name:var(--hud-font)] text-[10px] tracking-[0.28em]" style={{ color: accent }}>
            AURA
          </p>
          <p className="text-3xl font-black tabular-nums leading-none text-[#F2A021]">{score}</p>
          <p className="text-[11px] text-white/50">{unit}</p>
          {left}
        </div>
        <div className="text-right">
          <p className={`font-[family-name:var(--hud-font)] text-3xl font-black tabular-nums leading-none ${clutch ? 'text-[#E34B34]' : 'text-white'}`}>
            {secs}s
          </p>
          {right}
        </div>
      </div>
    </div>
  )
}
