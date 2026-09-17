'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { getWhatsAppHref } from '@/lib/brand/contact'
import { humoCopy } from '@/lib/humo/copy'
import { encodeShareSeed } from '@/lib/humo/sim'
import {
  anotherAlias,
  humoStars,
  humoTitle,
  saveIdentity,
  type HumoMission,
} from '@/lib/pulso/camba'
import {
  PULSO_WHATSAPP_PRESET,
  humoChallengeUrl,
  humoChallengeWhatsAppHref,
} from '@/lib/pulso/social'
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
  plays: number
  toBeat: number
  mission: HumoMission | null
  seed: number
  initialAlias: string
  initialTag: string
  runToken: string | null
  onRematch: () => void
}

export function HumoEndScreen({
  hectares,
  efficiency,
  arrived,
  rank,
  total,
  gap,
  today,
  personalBest,
  plays,
  toBeat,
  seed,
  initialAlias,
  initialTag,
  runToken,
  onRematch,
}: Props) {
  const [alias, setAlias] = useState(initialAlias)
  const [tag, setTag] = useState(initialTag)
  const [published, setPublished] = useState(true)
  const prize = useMemo(() => humoTitle(hectares, efficiency, arrived), [arrived, efficiency, hectares])
  const stars = humoStars(hectares, efficiency, arrived)
  const isRecord = hectares > personalBest
  const beatLead = toBeat > 0 && hectares >= toBeat
  const shareUrl = humoChallengeUrl(encodeShareSeed(seed))
  const shareText = humoCopy.shareText(hectares, prize.title, shareUrl, rank)
  const waHref = humoChallengeWhatsAppHref(shareText)
  const [pop, setPop] = useState(false)

  useEffect(() => {
    const id = window.setTimeout(() => setPop(true), 30)
    return () => window.clearTimeout(id)
  }, [])

  const share = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: humoCopy.title, text: shareText, url: shareUrl })
      } catch {
        /* cancel */
      }
      return
    }
    window.location.href = waHref
  }, [shareText, shareUrl, waHref])

  const publish = useCallback(async () => {
    saveIdentity(alias, tag)
    if (!runToken) {
      setPublished(true)
      return
    }
    try {
      await fetch('/api/pulso/run/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: runToken, alias, tag, aliasOnly: true }),
      })
    } catch {
      /* offline */
    }
    setPublished(true)
  }, [alias, runToken, tag])

  const icp = useCallback(async () => {
    try {
      await fetch('/api/pulso/interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'icp-whatsapp' }),
      })
    } catch {
      /* */
    }
    window.location.href = getWhatsAppHref(PULSO_WHATSAPP_PRESET)
  }, [])

  const rankLabel = rank != null ? `${rank}${total ? humoCopy.ofToday(total) : ''}` : '—'

  return (
    <div className="absolute inset-0 z-20 flex flex-col overflow-y-auto bg-[#0A0A0F]/95 px-4 py-5 [touch-action:pan-y]">
      <p className="text-center text-[11px] font-semibold tracking-[0.28em] text-[#16B57D]">{humoCopy.title}</p>
      <p className="mt-2 text-center text-sm font-semibold uppercase tracking-[0.16em] text-[#F2A021]">{prize.title}</p>
      <p className="mt-1 text-center text-lg tracking-[0.2em] text-[#F2A021]">
        {'★'.repeat(stars)}
        {'☆'.repeat(3 - stars)}
      </p>
      <p
        className={`mt-2 text-center text-7xl font-black tabular-nums text-[#F2A021] transition-transform duration-500 ${
          pop ? 'scale-100' : 'scale-75'
        }`}
      >
        {hectares}
      </p>
      <p className="mt-1 text-center text-sm text-[#D9DCE1]">
        {humoCopy.ha} · {efficiency}% · {arrived}/3
      </p>
      <p className="mt-2 text-center text-sm">
        {humoCopy.rankToday} <span className="font-semibold">{rankLabel}</span>
        {rank == null ? '' : rank === 1 ? ` · ${humoCopy.gapLead}` : ` · ${humoCopy.gap(gap)}`}
      </p>
      <p className="mt-1 text-center text-xs text-[#16B57D]">
        {isRecord ? humoCopy.newRecord : humoCopy.yourBest(Math.max(personalBest, hectares))}
        {beatLead ? ` · ${humoCopy.beatLead}` : ''}
      </p>

      {today.length > 0 ? (
        <ol className="mx-auto mt-4 w-full max-w-sm space-y-1.5 text-sm">
          {today.slice(0, 5).map((row, i) => (
            <li key={row.id} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-1.5">
              <span className="text-[#70757F]">{i + 1}</span>
              <span className="flex-1 px-2 font-medium">
                {row.alias} <span className="text-[10px] text-[#16B57D]">{row.tag}</span>
              </span>
              <span className="tabular-nums text-[#F2A021]">{row.score} ha</span>
            </li>
          ))}
        </ol>
      ) : null}

      <form
        className="mx-auto mt-4 flex w-full max-w-sm flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          void publish()
        }}
      >
        <div className="flex gap-2">
          <input
            id="humo-alias"
            aria-label={humoCopy.aliasLabel}
            maxLength={12}
            value={alias}
            onChange={(e) => {
              setAlias(e.target.value)
              setPublished(false)
            }}
            className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-[#16B57D]"
          />
          <input
            aria-label="Sigla"
            maxLength={3}
            value={tag}
            onChange={(e) => {
              setTag(e.target.value.toUpperCase())
              setPublished(false)
            }}
            className="w-16 rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-center text-sm outline-none focus:border-[#16B57D]"
          />
        </div>
        <button
          type="button"
          className="text-[11px] text-[#16B57D] underline-offset-2 hover:underline"
          onClick={() => {
            setAlias(anotherAlias(alias, String(plays), today.map((row) => row.alias)))
            setPublished(false)
          }}
        >
          {humoCopy.otherAlias}
        </button>
        {!published ? (
          <button type="submit" className="rounded-lg bg-[#16B57D] py-2.5 text-sm font-semibold text-[#0A0A0F]">
            {humoCopy.saveAlias}
          </button>
        ) : null}
      </form>

      <div className="mx-auto mt-4 flex w-full max-w-sm flex-col gap-2">
        <button
          type="button"
          onClick={() => void share()}
          className="rounded-lg bg-[#25D366] py-3 text-sm font-bold text-[#0A0A0F]"
        >
          {humoCopy.share}
        </button>
        <button
          type="button"
          onClick={onRematch}
          className="rounded-lg bg-[#F2A021] py-3 text-sm font-bold text-[#0A0A0F]"
        >
          {humoCopy.rematch}
        </button>
      </div>

      <button
        type="button"
        onClick={() => void icp()}
        className="mx-auto mt-3 mb-3 text-xs font-semibold text-[#16B57D]"
      >
        {humoCopy.icpCta}
      </button>
    </div>
  )
}
