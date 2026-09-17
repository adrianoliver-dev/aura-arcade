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
  seed: number
  initialAlias: string
  runToken: string | null
  toBeat: number
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
  seed,
  initialAlias,
  runToken,
  toBeat,
  onRematch,
}: Props) {
  const [alias, setAlias] = useState(initialAlias)
  const shareUrl = humoChallengeUrl(encodeShareSeed(seed))
  const shareText = humoCopy.shareText(hectares, medal, shareUrl, rank)
  const waHref = humoChallengeWhatsAppHref(shareText)
  const isRecord = hectares > personalBest
  const [saved, setSaved] = useState(false)

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
    saveIdentity(alias, 'SCZ')
    if (!runToken) {
      setSaved(true)
      return
    }
    try {
      await fetchWithTimeout('/api/humo/run/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: runToken, alias, aliasOnly: true }),
      })
    } catch {
      /* offline */
    }
    setSaved(true)
  }, [alias, runToken])

  return (
    <div className="absolute inset-0 z-30 flex flex-col overflow-y-auto bg-[#0D1210]/94 px-4 py-6 [touch-action:pan-y]">
      <p className="text-center text-sm tracking-[0.28em] text-[#19C37D]">{humoCopy.kicker}</p>
      <h2 className="font-display mt-2 text-center text-4xl text-[#F4E7CF]">{medal}</h2>
      <p className="font-display mt-3 text-center text-7xl tabular-nums text-[#FF9F1C]">{hectares}</p>
      <p className="text-center text-lg text-[#F4E7CF]">{humoCopy.ha}</p>
      <p className="mt-1 text-center text-sm text-[#C99052]">
        {arrived}/{FOCO_N} rutas · {rank != null ? `${rank}° de ${total || 'hoy'}` : 'ranking local'}
        {rank === 1 ? ` · ${humoCopy.gapLead}` : rank && rank > 1 ? ` · ${humoCopy.gap(gap)}` : ''}
      </p>
      <p className="mt-1 text-center text-sm text-[#19C37D]">
        {isRecord ? humoCopy.newRecord : humoCopy.yourBest(Math.max(personalBest, hectares))}
        {toBeat > 0 && hectares >= toBeat ? ' · Le ganaste al 1°' : ''}
      </p>

      <div className="mx-auto mt-5 flex w-full max-w-sm flex-col gap-2">
        <button
          type="button"
          onClick={onRematch}
          className="min-h-14 rounded-full bg-[#FF9F1C] font-display text-2xl text-[#0D1210]"
        >
          {humoCopy.rematch}
        </button>
        <button
          type="button"
          onClick={() => void share()}
          className="min-h-12 rounded-full border border-[#19C37D] font-display text-xl text-[#19C37D]"
        >
          {humoCopy.share}
        </button>
      </div>

      {today.length > 0 ? (
        <ol className="mx-auto mt-4 w-full max-w-sm space-y-1.5">
          {today.slice(0, 5).map((row, i) => (
            <li key={row.id} className="flex min-h-12 items-center justify-between rounded-xl bg-[#253C29] px-3">
              <span className="w-6 text-[#C99052]">{i + 1}</span>
              <span className="flex-1 text-[#F4E7CF]">{row.alias}</span>
              <span className="tabular-nums text-[#FF9F1C]">{row.score} ha</span>
            </li>
          ))}
        </ol>
      ) : null}

      <label className="mx-auto mt-4 flex w-full max-w-sm flex-col gap-2 text-sm text-[#F4E7CF]">
        {humoCopy.aliasLabel}
        <input
          maxLength={12}
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          className="min-h-12 rounded-xl border border-[#3E5A32] bg-[#253C29] px-3 text-[#F4E7CF]"
        />
      </label>
      <button
        type="button"
        onClick={() => void publish()}
        className="mx-auto mt-2 min-h-12 w-full max-w-sm rounded-xl border border-[#19C37D] text-[#19C37D]"
      >
        {saved ? 'En el ranking' : humoCopy.saveAlias}
      </button>
    </div>
  )
}
