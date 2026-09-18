'use client'

import { useCallback, useEffect, useState } from 'react'

import { logPlaytest } from '@/lib/arcade/session-log'
import { fetchWithTimeout } from '@/lib/arcade/fetch-timeout'
import { humoCopy } from '@/lib/humo/copy'
import { FOCO_N, encodeShareSeed } from '@/lib/humo/sim'
import { saveIdentity } from '@/lib/pulso/camba'
import { humoChallengeUrl, humoChallengeWhatsAppHref } from '@/lib/pulso/social'
import type { BoardEntry } from '@/lib/pulso/types'

type Props = {
  hectares: number
  efficiency: number
  arrived: number
  rank: number | null
  total: number
  gap: number
  today: BoardEntry[]
  personalBest: number
  medal: string
  headline: string
  dayBest: number
  seed: number
  initialAlias: string
  runToken: string | null
  toBeat: number
  offline: boolean
  onRematch: () => void
}

export function HumoEndScreen({
  hectares,
  arrived,
  rank,
  total,
  gap,
  today,
  personalBest,
  medal,
  headline,
  dayBest,
  seed,
  initialAlias,
  runToken,
  toBeat,
  offline,
  onRematch,
}: Props) {
  const [alias, setAlias] = useState(initialAlias)
  const [openBoard, setOpenBoard] = useState(false)
  const shareUrl = humoChallengeUrl(encodeShareSeed(seed))
  const shareText = humoCopy.shareText(hectares, medal, shareUrl, rank)
  const waHref = humoChallengeWhatsAppHref(shareText)
  const isRecord = hectares > personalBest
  const [saved, setSaved] = useState(false)
  const leftover = arrived < FOCO_N

  useEffect(() => {
    logPlaytest('HUMO', hectares, !runToken)
  }, [hectares, runToken])

  const share = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: humoCopy.title, text: shareText, url: shareUrl })
        return
      } catch {
        /* cancel */
      }
    }
    window.location.href = waHref
  }, [shareText, shareUrl, waHref])

  const publish = useCallback(async () => {
    const name = alias.trim()
    if (!name) return
    saveIdentity(name, 'SCZ')
    if (!runToken) {
      setSaved(true)
      return
    }
    try {
      await fetchWithTimeout('/api/humo/run/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: runToken, alias: name, aliasOnly: true }),
      })
    } catch {
      /* offline */
    }
    setSaved(true)
  }, [alias, runToken])

  return (
    <div className="absolute inset-x-0 bottom-0 z-30 flex max-h-[72%] flex-col bg-gradient-to-t from-[#0D1210] via-[#0D1210]/92 to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-10">
      <p className="text-center text-sm tracking-[0.28em] text-[#19C37D]">{humoCopy.kicker}</p>
      <h2 className="font-display mt-1 text-center text-4xl text-[#F4E7CF]">{medal}</h2>
      <p className="font-display mt-1 text-center text-6xl tabular-nums text-[#FF9F1C]">{hectares}</p>
      <p className="text-center text-base text-[#F4E7CF]">{humoCopy.ha}</p>
      <p className="mt-1 text-center text-sm text-[#F4E7CF]/90">{headline}</p>
      {leftover ? <p className="text-center text-sm text-[#FF9F1C]">{humoCopy.leftover}</p> : null}
      <p className="mt-1 text-center text-sm text-[#19C37D]">
        {isRecord ? humoCopy.newRecord : humoCopy.yourBest(Math.max(personalBest, hectares))}
        {dayBest > 0 ? ` · ${humoCopy.dayBest(dayBest)}` : ''}
      </p>

      <div className="mx-auto mt-3 flex w-full max-w-sm flex-col gap-2">
        <button
          type="button"
          onClick={onRematch}
          className="min-h-14 rounded-full bg-[#19C37D] font-display text-2xl text-[#0D1210]"
        >
          {humoCopy.rematch}
        </button>
        <button
          type="button"
          onClick={() => void share()}
          className="min-h-12 rounded-full border border-[#F4E7CF]/40 font-display text-lg text-[#F4E7CF]"
        >
          {humoCopy.share}
        </button>
      </div>

      <details
        className="mx-auto mt-3 w-full max-w-sm"
        open={openBoard}
        onToggle={(e) => setOpenBoard((e.target as HTMLDetailsElement).open)}
      >
        <summary className="cursor-pointer list-none text-center text-sm text-[#C99052] underline-offset-4 hover:underline">
          {offline ? humoCopy.offlineBoard : humoCopy.rankToday}
        </summary>
        {offline ? (
          <p className="mt-2 text-center text-sm text-[#F4E7CF]/80">{humoCopy.offlineBoard}</p>
        ) : (
          <>
            <p className="mt-2 text-center text-xs text-[#C99052]">
              {rank != null ? `${rank}° de ${total || 'hoy'}` : ''}
              {rank === 1 ? ` · ${humoCopy.gapLead}` : rank && rank > 1 ? ` · ${humoCopy.gap(gap)}` : ''}
              {toBeat > 0 && hectares >= toBeat ? ' · Superaste el fantasma' : ''}
            </p>
            {today.length > 0 ? (
              <ol className="mt-2 space-y-1">
                {today.slice(0, 5).map((row, i) => (
                  <li key={row.id} className="flex min-h-10 items-center justify-between rounded-lg bg-[#253C29]/80 px-3">
                    <span className="w-6 text-[#C99052]">{i + 1}</span>
                    <span className="flex-1 text-[#F4E7CF]">{row.alias}</span>
                    <span className="tabular-nums text-[#FF9F1C]">{row.score} ha</span>
                  </li>
                ))}
              </ol>
            ) : null}
            <label className="mt-3 flex flex-col gap-1 text-sm text-[#F4E7CF]">
              {humoCopy.aliasLabel}
              <input
                maxLength={12}
                value={alias}
                placeholder="opcional"
                onChange={(e) => setAlias(e.target.value)}
                className="min-h-12 rounded-xl border border-[#3E5A32] bg-[#253C29] px-3 text-[#F4E7CF]"
              />
            </label>
            <button
              type="button"
              onClick={() => void publish()}
              className="mt-2 min-h-12 w-full rounded-xl border border-[#19C37D] text-[#19C37D]"
            >
              {saved ? 'Listo' : humoCopy.saveAlias}
            </button>
          </>
        )}
      </details>
    </div>
  )
}
