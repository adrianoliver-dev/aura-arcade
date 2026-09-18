'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { humoCopy } from '@/lib/humo/copy'
import { qrSvg } from '@/lib/pulso/qr'
import { arcadePlayHostLabel, arcadeQrTarget } from '@/lib/pulso/social'
import type { BoardEntry, InterestPing } from '@/lib/pulso/types'

import { unlockPulsoAudio } from '@/components/pulso/pulso-audio'

import { HumoGame } from './humo-game'

type Overlay = 'none' | 'qr' | 'board'

export function HumoStand() {
  const [overlay, setOverlay] = useState<Overlay>('none')
  const [today, setToday] = useState<BoardEntry[]>([])
  const [fair, setFair] = useState<BoardEntry[]>([])
  const [interest, setInterest] = useState<InterestPing | null>(null)

  const qrSrc = useMemo(() => {
    const svg = qrSvg(arcadeQrTarget(), 320)
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  }, [])

  const refreshBoard = useCallback(async () => {
    try {
      const res = await fetch('/api/humo/leaderboard', { cache: 'no-store' })
      if (!res.ok) return
      const data = (await res.json()) as {
        today: BoardEntry[]
        fair: BoardEntry[]
        lastInterest: InterestPing | null
      }
      setToday(data.today ?? [])
      setFair(data.fair ?? [])
      setInterest(data.lastInterest)
    } catch {
      /* kiosko sin red */
    }
  }, [])

  useEffect(() => {
    const kick = window.setTimeout(() => void refreshBoard(), 0)
    const id = window.setInterval(() => void refreshBoard(), 8000)
    return () => {
      window.clearTimeout(kick)
      window.clearInterval(id)
    }
  }, [refreshBoard])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      void unlockPulsoAudio()
      const k = event.key.toLowerCase()
      if (k === 'q') setOverlay((o) => (o === 'qr' ? 'none' : 'qr'))
      else if (k === 'l') {
        void refreshBoard()
        setOverlay((o) => (o === 'board' ? 'none' : 'board'))
      } else if (k === 'v' || k === 'escape') setOverlay('none')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [refreshBoard])

  return (
    <div className="relative h-full w-full">
      <HumoGame demo />

      <p className="pointer-events-none absolute bottom-3 left-0 right-0 text-center text-[11px] tracking-[0.18em] text-white/40">
        {humoCopy.standKeys}
      </p>

      {overlay === 'qr' ? (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#0A0A0F]/92 px-6">
          <p className="text-[11px] font-semibold tracking-[0.3em] text-[#16B57D]">{humoCopy.title}</p>
          <h2 className="mt-2 text-3xl font-black">{humoCopy.standQr}</h2>
          <img
            src={qrSrc}
            alt={arcadeQrTarget()}
            width={320}
            height={320}
            className="mt-6 rounded-xl bg-white p-3"
          />
          <p className="mt-4 text-lg font-semibold tracking-wide text-[#F2A021]">{arcadePlayHostLabel()}</p>
        </div>
      ) : null}

      {overlay === 'board' ? (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#0A0A0F]/92 px-6">
          <h2 className="text-3xl font-black">{humoCopy.standBoard}</h2>
          <ol className="mt-6 w-full max-w-md space-y-2 text-lg">
            {today.length === 0 ? (
              <li className="text-center text-white/50">—</li>
            ) : (
              today.map((row, i) => (
                <li key={row.id} className="flex justify-between rounded-lg bg-white/5 px-4 py-2">
                  <span>
                    {i + 1}. {row.alias} <span className="text-xs text-[#16B57D]">{row.tag}</span>
                  </span>
                  <span className="tabular-nums text-[#F2A021]">{row.score} ha</span>
                </li>
              ))
            )}
          </ol>
          {fair.length > 0 ? (
            <p className="mt-6 text-sm text-white/50">{humoCopy.standFair(fair[0]!.alias, fair[0]!.score)}</p>
          ) : null}
          {interest ? (
            <p className="mt-3 text-xs text-[#16B57D]">
              {humoCopy.standInterest}: {new Date(interest.at).toLocaleTimeString('es-BO')}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
