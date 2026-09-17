'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { addXp, heatFromXp, loadXp, xpFromScore } from '@/lib/arcade/progress'
import { anotherAlias, saveIdentity } from '@/lib/pulso/camba'
import type { BoardEntry } from '@/lib/pulso/types'

type Props = {
  game: string
  score: number
  unit: string
  subtitle: string
  title: string
  rank: number | null
  total: number
  gap: number
  today: BoardEntry[]
  personalBest: number
  initialAlias: string
  initialTag: string
  runToken: string | null
  finishPath: string
  onRematch: () => void
}

export function ArcadeEnd({
  game,
  score,
  unit,
  subtitle,
  title,
  rank,
  total,
  gap,
  today,
  personalBest,
  initialAlias,
  initialTag,
  runToken,
  finishPath,
  onRematch,
}: Props) {
  const [alias, setAlias] = useState(initialAlias)
  const [tag, setTag] = useState(initialTag)
  const [published, setPublished] = useState(true)
  const granted = useRef(false)
  const [xpNow, setXpNow] = useState(0)
  const gained = xpFromScore(score)
  const isRecord = score > personalBest
  const shareText = `${title}: ${score} ${unit} en ${game}. ¿Me ganás?`

  useEffect(() => {
    if (granted.current) return
    granted.current = true
    setXpNow(addXp(gained))
  }, [gained])

  const share = useCallback(async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: game, text: shareText })
        return
      }
    } catch {
      /* cancel */
    }
    window.location.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`
  }, [game, shareText])

  const publish = useCallback(async () => {
    saveIdentity(alias, tag)
    if (!runToken) {
      setPublished(true)
      return
    }
    try {
      await fetch(finishPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: runToken, alias, tag, aliasOnly: true }),
      })
    } catch {
      /* offline */
    }
    setPublished(true)
  }, [alias, finishPath, runToken, tag])

  const rankLabel = rank != null ? `${rank}${total ? `/${total}` : ''}` : '—'
  const heat = heatFromXp(xpNow || loadXp())

  return (
    <div className="absolute inset-0 z-20 flex flex-col overflow-y-auto bg-[#0B0B10]/96 px-4 py-[max(1.25rem,env(safe-area-inset-top))] [touch-action:pan-y]">
      <p className="text-center font-[family-name:var(--hud-font)] text-[11px] tracking-[0.32em] text-[#16B57D]">{game}</p>
      <p className="mt-2 text-center text-sm font-semibold uppercase tracking-[0.16em] text-[#F2A021]">{title}</p>
      <p className="mt-3 text-center text-7xl font-black tabular-nums text-[#F2A021]">{score}</p>
      <p className="mt-1 text-center text-sm text-[#D9DCE1]">{unit}</p>
      <p className="mt-1 text-center text-xs text-white/50">{subtitle}</p>
      <p className="mt-3 text-center text-sm">
        Hoy <span className="font-semibold">{rankLabel}</span>
        {rank != null && rank > 1 ? ` · −${gap}` : ''}
      </p>
      <p className="mt-1 text-center text-xs text-[#16B57D]">{isRecord ? 'Récord' : `Mejor ${Math.max(personalBest, score)}`}</p>
      <p className="mt-2 text-center font-[family-name:var(--hud-font)] text-[11px] tracking-[0.18em] text-[#F2A021]">
        +{gained} XP · Calor {heat}
      </p>

      {today.length > 0 ? (
        <ol className="mx-auto mt-4 w-full max-w-sm space-y-1.5 text-sm">
          {today.slice(0, 5).map((row, i) => (
            <li key={row.id} className="flex min-h-[44px] items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3">
              <span className="text-[#70757F]">{i + 1}</span>
              <span className="flex-1 px-2 font-medium">{row.alias}</span>
              <span className="tabular-nums text-[#F2A021]">{row.score}</span>
            </li>
          ))}
        </ol>
      ) : null}

      <form
        className="mx-auto mt-4 flex w-full max-w-sm gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          void publish()
        }}
      >
        <label className="sr-only" htmlFor="arcade-alias">
          Apodo
        </label>
        <input
          id="arcade-alias"
          maxLength={12}
          value={alias}
          aria-label="Apodo"
          placeholder="Apodo"
          onChange={(e) => {
            setAlias(e.target.value)
            setPublished(false)
          }}
          className="min-h-11 min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-[#16B57D]"
        />
        <label className="sr-only" htmlFor="arcade-tag">
          Tag
        </label>
        <input
          id="arcade-tag"
          maxLength={3}
          value={tag}
          aria-label="Tag"
          placeholder="SC"
          onChange={(e) => {
            setTag(e.target.value.toUpperCase())
            setPublished(false)
          }}
          className="h-11 w-16 rounded-lg border border-white/10 bg-white/5 px-2 text-center text-sm focus:border-[#16B57D]"
        />
      </form>
      <button
        type="button"
        className="mx-auto mt-1 min-h-[44px] text-[11px] text-[#16B57D]"
        onClick={() => {
          setAlias(anotherAlias(alias, String(score), today.map((row) => row.alias)))
          setPublished(false)
        }}
      >
        Otro
      </button>
      {!published ? (
        <button
          type="button"
          onClick={() => void publish()}
          className="mx-auto mt-2 min-h-[44px] w-full max-w-sm rounded-lg bg-[#16B57D] text-sm font-semibold text-[#0A0A0F]"
        >
          Guardar
        </button>
      ) : null}

      <div className="mx-auto mt-4 flex w-full max-w-sm flex-col gap-2 pb-8">
        <button type="button" onClick={() => void share()} className="min-h-[48px] rounded-lg bg-[#25D366] text-sm font-bold text-[#0A0A0F]">
          WhatsApp
        </button>
        <button type="button" onClick={onRematch} className="min-h-[48px] rounded-lg bg-[#F2A021] text-sm font-bold text-[#0A0A0F]">
          Otra
        </button>
      </div>
    </div>
  )
}
