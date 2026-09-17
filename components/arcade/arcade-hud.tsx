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
  const danger = clutch || secs <= 8
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div
        className="mx-auto max-w-lg overflow-hidden rounded-xl border bg-black/70 backdrop-blur-md"
        style={{
          borderColor: danger ? '#E34B34' : `${accent}66`,
          boxShadow: danger ? '0 0 28px #E34B3488' : `0 0 20px ${accent}28`,
        }}
      >
        <div className="flex items-start justify-between px-3 py-2">
          <div className="min-w-0">
            <p className="font-[family-name:var(--hud-font)] text-[10px] tracking-[0.32em]" style={{ color: accent }}>
              AURA
            </p>
            <p className="text-3xl font-black tabular-nums leading-none text-[#F2A021]">{score}</p>
            <p className="text-[11px] text-white/55">{unit}</p>
            {left}
          </div>
          <div className="text-right">
            <p
              className={`font-[family-name:var(--hud-font)] text-3xl font-black tabular-nums leading-none ${
                danger ? 'text-[#E34B34]' : 'text-white'
              }`}
            >
              {secs}s
            </p>
            {right}
          </div>
        </div>
        <div className="h-1 bg-white/10">
          <div
            className="h-full"
            style={{
              width: `${Math.min(100, (secs / 90) * 100)}%`,
              background: danger ? '#E34B34' : accent,
            }}
          />
        </div>
      </div>
    </div>
  )
}
