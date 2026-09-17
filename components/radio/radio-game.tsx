'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { ArcadeEnd } from '@/components/arcade/arcade-end'
import {
  playHumoClutch,
  playHumoSave,
  playPulsoSfx,
  unlockPulsoAudio,
} from '@/components/pulso/pulso-audio'
import {
  MATCH_MS,
  buildCalls,
  liveCall,
  radioTitle,
  simulateRun,
  type Action,
  type Call,
  type Decision,
} from '@/lib/radio/sim'
import { loadIdentity } from '@/lib/pulso/camba'
import { loadGameBest, saveGameBest } from '@/lib/arcade/liga'
import type { BoardEntry } from '@/lib/pulso/types'

const ACTIONS: { id: Action; label: string; hint: string; color: string }[] = [
  { id: 'agua', label: 'AGUA', hint: 'Apagá', color: '#3B82F6' },
  { id: 'corte', label: 'CORTE', hint: 'Pared', color: '#F2A021' },
  { id: 'evacua', label: 'EVACUÁ', hint: 'Gente', color: '#E34B34' },
]

type Phase = 'boot' | 'ready' | 'play' | 'end'

export function RadioGame() {
  const tRef = useRef(0)
  const seedRef = useRef(1)
  const tokenRef = useRef<string | null>(null)
  const callsRef = useRef<Call[]>([])
  const doneRef = useRef(new Set<number>())
  const decisionsRef = useRef<Decision[]>([])
  const clutchRef = useRef(new Set<number>())
  const lastRef = useRef(0)
  const endedRef = useRef(false)
  const [phase, setPhase] = useState<Phase>('boot')
  const [identity, setIdentity] = useState({ alias: '', tag: 'SCZ' })
  const [hud, setHud] = useState({
    left: MATCH_MS,
    score: 0,
    streak: 0,
    houses: 3,
    juice: '',
    call: null as Call | null,
    clutch: false,
  })
  const [shake, setShake] = useState(0)
  const [flash, setFlash] = useState<'ok' | 'bad' | null>(null)
  const [toBeat, setToBeat] = useState(0)
  const [result, setResult] = useState<{
    score: number
    subtitle: string
    title: string
    rank: number | null
    total: number
    gap: number
    today: BoardEntry[]
    personalBest: number
  } | null>(null)

  const startRun = useCallback(async () => {
    setResult(null)
    setPhase('boot')
    tRef.current = 0
    doneRef.current = new Set()
    clutchRef.current = new Set()
    decisionsRef.current = []
    endedRef.current = false
    const id = loadIdentity(String(seedRef.current))
    setIdentity(id)
    try {
      const boardRes = await fetch('/api/radio/leaderboard', { cache: 'no-store' })
      if (boardRes.ok) {
        const board = (await boardRes.json()) as { today: BoardEntry[] }
        setToBeat(board.today[0]?.score ?? 0)
      }
    } catch {
      /* */
    }
    try {
      const res = await fetch('/api/radio/run/start', { method: 'POST' })
      if (!res.ok) throw new Error('start')
      const data = (await res.json()) as { seed: number; token: string }
      seedRef.current = data.seed
      tokenRef.current = data.token
      callsRef.current = buildCalls(data.seed)
      setIdentity(loadIdentity(data.token))
    } catch {
      seedRef.current = (Date.now() ^ 0x51d4e5) >>> 0 || 1
      tokenRef.current = null
      callsRef.current = buildCalls(seedRef.current)
      setIdentity(loadIdentity(String(seedRef.current)))
    }
    setHud({ left: MATCH_MS, score: 0, streak: 0, houses: 3, juice: '', call: null, clutch: false })
    setPhase('ready')
  }, [])

  useEffect(() => {
    void startRun()
  }, [startRun])

  const finish = useCallback(async () => {
    if (endedRef.current) return
    endedRef.current = true
    const local = simulateRun(seedRef.current, decisionsRef.current)
    const prize = radioTitle(local.score, local.saves, local.housesLeft)
    const prevBest = loadGameBest('radio')
    saveGameBest('radio', local.score)
    const base = {
      score: local.score,
      subtitle: `${local.saves} bien · ${local.misses} mal · ${local.housesLeft} casas`,
      title: prize.title,
      rank: null as number | null,
      total: 0,
      gap: 0,
      today: [] as BoardEntry[],
      personalBest: prevBest,
    }
    setResult(base)
    if (!tokenRef.current) return
    try {
      const res = await fetch('/api/radio/run/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: tokenRef.current,
          decisions: decisionsRef.current,
          alias: identity.alias,
          tag: identity.tag,
        }),
      })
      if (!res.ok) return
      const data = (await res.json()) as {
        score: number
        rank: number
        total: number
        gap: number
        today: BoardEntry[]
      }
      setResult({
        ...base,
        score: data.score,
        rank: data.rank,
        total: data.total,
        gap: data.gap,
        today: data.today ?? [],
      })
    } catch {
      /* offline */
    }
  }, [identity.alias, identity.tag])

  const pick = useCallback(
    (action: Action) => {
      void unlockPulsoAudio()
      if (phase !== 'play') return
      const call = liveCall(tRef.current, callsRef.current, doneRef.current)
      if (!call) return
      doneRef.current.add(call.id)
      decisionsRef.current.push({ id: call.id, action, t: tRef.current })
      const ok = action === call.correct
      try {
        navigator.vibrate?.(ok ? 18 : 42)
      } catch {
        /* */
      }
      if (ok) {
        playHumoSave(call.stake)
        setFlash('ok')
        setHud((h) => {
          const streak = h.streak + 1
          const bonus = 1 + Math.min(streak - 1, 5) * 0.15
          return {
            ...h,
            score: h.score + Math.round(call.stake * bonus),
            streak,
            juice: streak >= 3 ? `x${streak}` : '¡SÍ!',
            call: null,
            clutch: false,
          }
        })
      } else {
        playPulsoSfx('miss')
        setFlash('bad')
        setShake(12)
        setHud((h) => ({
          ...h,
          streak: 0,
          houses: Math.max(0, h.houses - 1),
          juice: 'NO',
          call: null,
          clutch: false,
        }))
      }
      window.setTimeout(() => setFlash(null), 180)
    },
    [phase],
  )

  useEffect(() => {
    if (phase !== 'play') return
    lastRef.current = performance.now()
    let raf = 0
    const loop = (now: number) => {
      const dt = Math.min(40, now - lastRef.current)
      lastRef.current = now
      tRef.current = Math.min(MATCH_MS, tRef.current + dt)
      const t = tRef.current
      const call = liveCall(t, callsRef.current, doneRef.current)
      if (call && !doneRef.current.has(call.id)) {
        const left = call.commitMs - t
        if (left < 1800 && left > 0 && !clutchRef.current.has(call.id)) {
          clutchRef.current.add(call.id)
          playHumoClutch()
        }
      }
      for (const c of callsRef.current) {
        if (t >= c.commitMs && !doneRef.current.has(c.id)) {
          doneRef.current.add(c.id)
          playPulsoSfx('brecha')
          setHud((h) => ({
            ...h,
            streak: 0,
            houses: Math.max(0, h.houses - 1),
            juice: 'TARDE',
          }))
        }
      }
      setHud((h) => ({
        ...h,
        left: MATCH_MS - t,
        call,
        clutch: Boolean(call && call.commitMs - t < 1800),
      }))
      setShake((s) => s * 0.82)
      if (t >= MATCH_MS) {
        setPhase('end')
        void finish()
        return
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [finish, phase])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && phase === 'ready') {
        void unlockPulsoAudio()
        tRef.current = 0
        lastRef.current = performance.now()
        setPhase('play')
        return
      }
      if (phase !== 'play') return
      if (event.key === '1') pick('agua')
      if (event.key === '2') pick('corte')
      if (event.key === '3') pick('evacua')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, pick])

  const call = hud.call
  const windowLeft = call ? Math.max(0, call.commitMs - tRef.current) : 0
  const windowMax = call ? Math.max(1, call.commitMs - call.appearMs) : 1

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        transform: shake ? `translate(${(Math.random() - 0.5) * shake}px, ${(Math.random() - 0.5) * shake}px)` : undefined,
        background: hud.clutch ? '#1a0808' : '#0A0A0F',
      }}
    >
      {flash ? (
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{ background: flash === 'ok' ? 'rgba(22,181,125,0.28)' : 'rgba(227,75,52,0.35)' }}
        />
      ) : null}

      {phase === 'ready' ? (
        <button
          type="button"
          className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center"
          onClick={() => {
            void unlockPulsoAudio()
            tRef.current = 0
            lastRef.current = performance.now()
            setPhase('play')
          }}
        >
          <p className="text-[11px] tracking-[0.32em] text-[#E34B34]">RADIO ROJA</p>
          <p className="mt-3 text-3xl font-black">El predio llama.</p>
          <p className="mt-3 max-w-xs text-sm text-white/70">Tres botones. Poco tiempo. Cada error quema una casa.</p>
          {toBeat > 0 ? <p className="mt-3 text-xs text-white/45">A vencer {toBeat}</p> : null}
          <p className="mt-8 animate-pulse text-xs tracking-[0.2em] text-[#F2A021]">TOCÁ · 90s</p>
        </button>
      ) : null}

      {phase === 'play' ? (
        <div className="flex h-full flex-col px-4 pb-5 pt-14">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-4xl font-black tabular-nums text-[#F2A021]">{hud.score}</p>
              <p className="text-[11px] text-white/50">pts</p>
              {hud.streak > 1 ? <p className="text-sm font-black text-[#C4B5FD]">x{hud.streak}</p> : null}
            </div>
            <div className="text-right">
              <p className={`text-3xl font-black ${hud.clutch ? 'text-[#E34B34]' : ''}`}>{Math.ceil(hud.left / 1000)}s</p>
              <p className="mt-1 text-lg tracking-[0.2em]">{'⌂'.repeat(hud.houses)}{'·'.repeat(Math.max(0, 3 - hud.houses))}</p>
            </div>
          </div>

          <div className="mt-4 min-h-[9.5rem] rounded-2xl border border-[#E34B34]/40 bg-[#E34B34]/10 p-4 text-center">
            {call ? (
              <>
                <p className="text-[11px] tracking-[0.2em] text-[#F2A021]">{hud.clutch ? 'YA' : 'CENTRAL'}</p>
                <p className="mt-2 text-xl font-black leading-tight sm:text-2xl">{call.prompt}</p>
                <p className="mt-2 text-sm text-white/60">{call.clue}</p>
                <div className="mx-auto mt-3 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full ${hud.clutch ? 'bg-[#E34B34]' : 'bg-[#F2A021]'}`}
                    style={{ width: `${Math.min(100, (windowLeft / windowMax) * 100)}%` }}
                  />
                </div>
              </>
            ) : (
              <p className="pt-8 text-sm text-white/50">La radio crepita…</p>
            )}
          </div>

          {hud.juice ? <p className="mt-3 text-center text-2xl font-black text-[#7DDC68]">{hud.juice}</p> : <div className="mt-3 h-8" />}

          <div className="mt-auto grid grid-cols-3 gap-2">
            {ACTIONS.map((a) => (
              <button
                key={a.id}
                type="button"
                disabled={!call}
                onPointerDown={(event) => {
                  event.preventDefault()
                  pick(a.id)
                }}
                className="rounded-xl py-5 text-center font-black disabled:opacity-40"
                style={{ background: a.color, color: '#0A0A0F' }}
              >
                <span className="block text-lg">{a.label}</span>
                <span className="block text-[11px] font-semibold opacity-80">{a.hint}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {phase === 'end' && result ? (
        <ArcadeEnd
          game="RADIO ROJA"
          score={result.score}
          unit="pts"
          subtitle={result.subtitle}
          title={result.title}
          rank={result.rank}
          total={result.total}
          gap={result.gap}
          today={result.today}
          personalBest={result.personalBest}
          initialAlias={identity.alias}
          initialTag={identity.tag}
          runToken={tokenRef.current}
          finishPath="/api/radio/run/finish"
          onRematch={() => void startRun()}
        />
      ) : null}
    </div>
  )
}
