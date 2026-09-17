'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { logPlaytest } from '@/lib/arcade/session-log'

import { getWhatsAppHref } from '@/lib/brand/contact'
import {
  anotherAlias,
  missionProgress,
  pulsoStars,
  pulsoTitle,
  saveIdentity,
  type DailyMission,
} from '@/lib/pulso/camba'
import { pulsoCopy } from '@/lib/pulso/copy'
import {
  PULSO_FACEBOOK_URL,
  PULSO_INSTAGRAM_URL,
  PULSO_LINKEDIN_URL,
  PULSO_PUBLIC_URL,
  PULSO_WHATSAPP_PRESET,
} from '@/lib/pulso/social'
import type { BoardEntry } from '@/lib/pulso/types'

type Props = {
  score: number
  comboMax: number
  kills: number
  perfects: number
  breaches: number
  rank: number | null
  total: number
  gap: number
  today: BoardEntry[]
  personalBest: number
  plays: number
  toBeat: number
  mission: DailyMission | null
  initialAlias: string
  initialTag: string
  runToken: string | null
  onRematch: () => void
}

export function PulsoEndScreen({
  score,
  comboMax,
  kills,
  perfects,
  breaches,
  rank,
  total,
  gap,
  today,
  personalBest,
  plays,
  toBeat,
  mission,
  initialAlias,
  initialTag,
  runToken,
  onRematch,
}: Props) {
  const [alias, setAlias] = useState(initialAlias)
  const [tag, setTag] = useState(initialTag)
  const [copied, setCopied] = useState(false)
  const [published, setPublished] = useState(true)
  const prize = useMemo(() => pulsoTitle(score, comboMax, kills), [comboMax, kills, score])
  const stars = pulsoStars(score, comboMax, kills, breaches)
  const isRecord = score > personalBest
  const beatLead = toBeat > 0 && score >= toBeat
  const missionState = mission
    ? missionProgress(mission, { perfects, kills, comboMax, breaches })
    : null

  const shareText = pulsoCopy.shareText(score, prize.title)

  useEffect(() => {
    logPlaytest('PULSO', score, !runToken)
  }, [runToken, score])

  const share = useCallback(async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'AURA PULSO', text: shareText, url: PULSO_PUBLIC_URL })
        return
      }
    } catch {
      /* cancel */
    }
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }, [shareText])

  const publish = useCallback(async () => {
    saveIdentity(alias, tag)
    if (!runToken) {
      setPublished(true)
      return
    }
    try {
      await fetch('/api/anillos/run/finish', {
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

  const rankLabel = rank != null ? `${rank}${total ? ` ${pulsoCopy.ofToday(total)}` : ''}` : '—'

  return (
    <div className="absolute inset-0 z-20 flex flex-col overflow-y-auto bg-[#0A0A0F]/95 px-4 py-5 [touch-action:pan-y]">
      <p className="text-center text-[11px] font-semibold tracking-[0.28em] text-[#16B57D]">{pulsoCopy.title}</p>
      <p className="mt-2 text-center text-xs uppercase tracking-[0.18em] text-[#F2A021]">{prize.title}</p>
      <p className="mt-1 text-center text-lg tracking-[0.2em] text-[#F2A021]">{'★'.repeat(stars)}{'☆'.repeat(3 - stars)}</p>
      <h1 className="mt-1 text-center text-2xl font-bold tracking-tight">{pulsoCopy.endTitle}</h1>
      <p className="mt-3 text-center text-6xl font-black tabular-nums text-[#F2A021]">{score}</p>
      <p className="mt-1 text-center text-sm text-[#D9DCE1]">
        {pulsoCopy.combo} ×{Math.min(1 + 0.2 * comboMax, 4).toFixed(1)} · {pulsoCopy.focos} {kills}
      </p>
      <p className="mt-2 text-center text-sm">
        {pulsoCopy.rankToday}: <span className="font-semibold">{rankLabel}</span>
      </p>
      <p className="mt-1 text-center text-xs text-[#70757F]">
        {rank == null ? pulsoCopy.offline : rank === 1 ? pulsoCopy.gapLead : pulsoCopy.gap(gap)}
      </p>
      <p className="mt-1 text-center text-xs text-[#16B57D]">
        {isRecord ? pulsoCopy.newRecord : pulsoCopy.yourBest(Math.max(personalBest, score))}
      </p>
      {beatLead ? <p className="mt-1 text-center text-xs text-[#F2A021]">{pulsoCopy.beatLead}</p> : null}
      <p className="mt-1 text-center text-[11px] text-white/40">{pulsoCopy.plays(plays)}</p>
      <p className="mx-auto mt-3 max-w-sm text-center text-sm leading-relaxed text-[#D9DCE1]">{prize.blurb}</p>

      {mission && missionState ? (
        <p
          className={`mx-auto mt-3 max-w-sm rounded-full px-3 py-1 text-center text-[11px] ${
            missionState.done
              ? 'border border-[#16B57D]/50 bg-[#16B57D]/15 text-[#7DDC68]'
              : 'border border-white/15 bg-white/5 text-white/70'
          }`}
        >
          {missionState.done
            ? `${pulsoCopy.missionDone}: ${mission.label}`
            : `${pulsoCopy.mission}: ${mission.label} · ${pulsoCopy.missionLeft(Math.max(0, mission.goal - missionState.current))}`}
        </p>
      ) : null}

      <div className="mx-auto mt-4 w-full max-w-sm rounded-xl border border-[#16B57D]/40 bg-[#16B57D]/10 p-3 text-center">
        <p className="text-[11px] uppercase tracking-wide text-[#16B57D]">{pulsoCopy.won}</p>
        <p className="mt-1 text-sm font-semibold">{prize.title}</p>
        <p className="mt-1 text-xs text-white/70">{pulsoCopy.wonBody}</p>
      </div>

      {today.length > 0 ? (
        <ol className="mx-auto mt-4 w-full max-w-sm space-y-1.5 text-sm">
          {today.slice(0, 5).map((row, i) => (
            <li key={row.id} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-1.5">
              <span className="text-[#70757F]">{i + 1}</span>
              <span className="flex-1 px-2 font-medium">
                {row.alias} <span className="text-[10px] text-[#16B57D]">{row.tag}</span>
              </span>
              <span className="tabular-nums text-[#F2A021]">{row.score}</span>
            </li>
          ))}
        </ol>
      ) : null}

      <form
        className="mx-auto mt-5 flex w-full max-w-sm flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          void publish()
        }}
      >
        <label className="text-[11px] uppercase tracking-wide text-[#70757F]" htmlFor="pulso-alias">
          {pulsoCopy.aliasLabel}
        </label>
        <div className="flex gap-2">
          <input
            id="pulso-alias"
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
            setAlias(anotherAlias(alias, String(plays)))
            setPublished(false)
          }}
        >
          {pulsoCopy.otherAlias}
        </button>
        {!published ? (
          <button type="submit" className="rounded-lg bg-[#16B57D] py-2.5 text-sm font-semibold text-[#0A0A0F]">
            {pulsoCopy.saveAlias}
          </button>
        ) : (
          <p className="text-center text-[11px] text-white/50">En el ranking figurás como {alias}</p>
        )}
      </form>

      <div className="mx-auto mt-5 flex w-full max-w-sm flex-col gap-2">
        <button
          type="button"
          onClick={onRematch}
          className="rounded-lg bg-[#F2A021] py-3 text-sm font-bold text-[#0A0A0F]"
        >
          {pulsoCopy.rematch}
        </button>
        <button
          type="button"
          onClick={() => void share()}
          className="rounded-lg border border-white/15 py-2.5 text-sm font-semibold"
        >
          {copied ? pulsoCopy.copied : pulsoCopy.share}
        </button>
      </div>

      <p className="mt-4 text-center text-[11px] uppercase tracking-[0.2em] text-[#70757F]">{pulsoCopy.follow}</p>
      <div className="mt-2 flex justify-center gap-4 text-sm font-semibold text-[#16B57D]">
        <a href={PULSO_FACEBOOK_URL} target="_blank" rel="noreferrer">
          {pulsoCopy.fb}
        </a>
        <a href={PULSO_LINKEDIN_URL} target="_blank" rel="noreferrer">
          {pulsoCopy.li}
        </a>
        {PULSO_INSTAGRAM_URL ? (
          <a href={PULSO_INSTAGRAM_URL} target="_blank" rel="noreferrer">
            {pulsoCopy.ig}
          </a>
        ) : null}
      </div>
      <p className="mx-auto mt-4 max-w-sm text-center text-xs leading-relaxed text-[#D9DCE1]">{pulsoCopy.brand}</p>

      <div className="mx-auto mt-6 mb-4 w-full max-w-sm rounded-xl border border-white/10 p-3">
        <p className="text-center text-sm">{pulsoCopy.icp}</p>
        <button
          type="button"
          onClick={() => void icp()}
          className="mt-2 w-full rounded-lg border border-[#16B57D] py-2.5 text-sm font-semibold text-[#16B57D]"
        >
          {pulsoCopy.icpCta}
        </button>
      </div>
    </div>
  )
}
