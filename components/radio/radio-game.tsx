'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { ArcadeBoot } from '@/components/arcade/arcade-boot'
import { ArcadeEnd } from '@/components/arcade/arcade-end'
import { ArcadeHud } from '@/components/arcade/arcade-hud'
import { ArcadeReady } from '@/components/arcade/arcade-ready'
import {
  playHumoClutch,
  playHumoSave,
  playPulsoSfx,
  unlockPulsoAudio,
} from '@/components/pulso/pulso-audio'
import {
  MATCH_MS,
  buildCalls,
  emptyAmmo,
  liveCall,
  radioTitle,
  simulateRun,
  type Action,
  type Call,
  type Decision,
} from '@/lib/radio/sim'
import { loadIdentity } from '@/lib/pulso/camba'
import { loadGameBest, saveGameBest } from '@/lib/arcade/liga'
import { useDemoRematch } from '@/lib/arcade/use-demo-rematch'
import type { BoardEntry } from '@/lib/pulso/types'

const ACTIONS: { id: Action; label: string; hint: string; color: string; rule: string }[] = [
  { id: 'agua', label: 'AGUA', hint: 'foco + tanque', color: '#2B9ED6', rule: 'Apagá el foco' },
  { id: 'corte', label: 'CORTE', hint: 'viento + monte', color: '#F2A021', rule: 'Cortá el avance' },
  { id: 'evacua', label: 'EVACUÁ', hint: 'personas', color: '#E34B34', rule: 'Sacá a la gente' },
]

type Phase = 'boot' | 'ready' | 'play' | 'end'

export function RadioGame({ demo = false }: { demo?: boolean }) {
  const phaseRef = useRef<Phase>('boot')
  const tRef = useRef(0)
  const seedRef = useRef(1)
  const tokenRef = useRef<string | null>(null)
  const callsRef = useRef<Call[]>([])
  const doneRef = useRef(new Set<number>())
  const decisionsRef = useRef<Decision[]>([])
  const clutchRef = useRef(new Set<number>())
  const lastRef = useRef(0)
  const endedRef = useRef(false)
  const ammoRef = useRef(emptyAmmo())
  const autoRef = useRef(new Set<number>())
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
    ammo: emptyAmmo(),
  })
  const [shake, setShake] = useState(0)
  const [flash, setFlash] = useState<'ok' | 'bad' | null>(null)
  const [toBeat, setToBeat] = useState(0)
  const [learn, setLearn] = useState(true)
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

  const setPhaseBoth = (next: Phase) => {
    phaseRef.current = next
    setPhase(next)
  }

  const startRun = useCallback(async () => {
    setResult(null)
    setPhaseBoth('boot')
    tRef.current = 0
    doneRef.current = new Set()
    clutchRef.current = new Set()
    autoRef.current = new Set()
    decisionsRef.current = []
    endedRef.current = false
    ammoRef.current = emptyAmmo()
    setLearn(true)
    const id = loadIdentity(String(seedRef.current))
    setIdentity(id)
    if (demo) {
      seedRef.current = (Date.now() ^ 0x51d4e5) >>> 0 || 1
      tokenRef.current = null
      callsRef.current = buildCalls(seedRef.current)
      setIdentity(loadIdentity(String(seedRef.current)))
      setHud({ left: MATCH_MS, score: 0, streak: 0, houses: 3, juice: '', call: null, clutch: false, ammo: emptyAmmo() })
      setPhaseBoth('ready')
      return
    }
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
    setHud({ left: MATCH_MS, score: 0, streak: 0, houses: 3, juice: '', call: null, clutch: false, ammo: emptyAmmo() })
    setPhaseBoth('ready')
  }, [demo])

  useEffect(() => {
    void startRun()
  }, [startRun])

  useEffect(() => {
    const host = window as Window & {
      __radioGuide?: () => {
        phase: Phase
        clue: string | null
        prompt: string | null
        correct: Action | null
        label: string | null
      } | null
    }
    host.__radioGuide = () => {
      const call = liveCall(tRef.current, callsRef.current, doneRef.current)
      const label = call ? ACTIONS.find((row) => row.id === call.correct)?.label ?? null : null
      return {
        phase: phaseRef.current,
        clue: call?.clue ?? null,
        prompt: call?.prompt ?? null,
        correct: call?.correct ?? null,
        label,
      }
    }
    return () => {
      delete host.__radioGuide
    }
  }, [])

  const finish = useCallback(async () => {
    if (endedRef.current) return
    endedRef.current = true
    const local = simulateRun(seedRef.current, decisionsRef.current)
    const prize = radioTitle(local.score, local.saves, local.housesLeft)
    const prevBest = loadGameBest('radio')
    if (!demo) saveGameBest('radio', local.score)
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
    if (demo || !tokenRef.current) return
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
  }, [demo, identity.alias, identity.tag])

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
        setLearn(false)
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
            ammo: { ...ammoRef.current },
          }
        })
      } else {
        playPulsoSfx('miss')
        setFlash('bad')
        setShake(12)
        setHud((h) => {
          const houses = Math.max(0, h.houses - 1)
          if (houses === 0) {
            setPhaseBoth('end')
            void finish()
          }
          return {
            ...h,
            streak: 0,
            houses,
            juice: 'NO',
            call: null,
            clutch: false,
            ammo: { ...ammoRef.current },
          }
        })
      }
      window.setTimeout(() => setFlash(null), 180)
    },
    [finish, phase],
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
      if (t > 6_500) setLearn(false)
      if (endedRef.current) return
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
          setHud((h) => {
            const houses = Math.max(0, h.houses - 1)
            if (houses === 0) {
              setPhaseBoth('end')
              void finish()
            }
            return {
              ...h,
              streak: 0,
              houses,
              juice: 'TARDE',
            }
          })
        }
      }
      setHud((h) => ({
        ...h,
        left: MATCH_MS - t,
        call,
        clutch: Boolean(call && call.commitMs - t < 1800),
      }))
      if (demo && call && !autoRef.current.has(call.id) && t > call.appearMs + 420) {
        autoRef.current.add(call.id)
        pick(call.correct)
      }
      setShake((s) => s * 0.82)
      if (t >= MATCH_MS) {
        setPhaseBoth('end')
        void finish()
        return
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [demo, finish, phase, pick])

  useEffect(() => {
    if (!demo || phase !== 'ready') return
    const id = window.setTimeout(() => {
      void unlockPulsoAudio()
      tRef.current = 0
      lastRef.current = performance.now()
      setPhaseBoth('play')
    }, 900)
    return () => window.clearTimeout(id)
  }, [demo, phase])

  useDemoRematch(demo, phase, () => {
    void startRun()
  })

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && phase === 'ready') {
        void unlockPulsoAudio()
        tRef.current = 0
        lastRef.current = performance.now()
        setPhaseBoth('play')
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
        background: hud.clutch
          ? 'radial-gradient(circle at 50% 28%, #4a1614 0%, #180b0c 42%, #080d0b 100%)'
          : 'radial-gradient(circle at 50% 26%, #193626 0%, #101a14 42%, #080d0b 100%)',
      }}
    >
      {phase === 'boot' ? <ArcadeBoot label="Sintonizando radio" /> : null}
      {flash ? (
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{ background: flash === 'ok' ? 'rgba(22,181,125,0.28)' : 'rgba(227,75,52,0.35)' }}
        />
      ) : null}

      {phase === 'ready' ? (
        <ArcadeReady
          kicker="RADIO ROJA"
          title="El predio llama."
          body="Tres botones. Siete señales. Cada error quema una casa."
          cue="ENTENDIDO · 45 S"
          accent="#E34B34"
          toBeat={toBeat}
          onStart={() => {
            void unlockPulsoAudio()
            tRef.current = 0
            lastRef.current = performance.now()
            setPhaseBoth('play')
          }}
        />
      ) : null}

      {phase === 'play' ? (
        <div className="flex h-full flex-col px-4 pb-[max(1.1rem,env(safe-area-inset-bottom))] pt-24">
          <ArcadeHud
            score={hud.score}
            timeMs={hud.left}
            matchMs={MATCH_MS}
            accent="#E34B34"
            clutch={hud.clutch}
            left={
              <>
                {hud.streak > 1 ? <p className="text-sm font-black text-[#C4B5FD]">x{hud.streak}</p> : null}
              </>
            }
            right={
              <div className="mt-1 flex justify-end gap-1" aria-label={`${hud.houses} casas`}>
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="inline-block h-3 w-3 rounded-sm"
                    style={{ background: i < hud.houses ? '#F2A021' : 'rgba(255,255,255,0.18)' }}
                  />
                ))}
              </div>
            }
          />

          <div className="relative mx-auto mt-4 min-h-[12rem] w-full max-w-4xl overflow-hidden rounded-[1.75rem] border border-[#E34B34]/45 bg-[#140e0e]/72 p-5 text-center shadow-[0_20px_55px_rgba(0,0,0,0.32)] md:min-h-[15rem] md:p-7">
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#F2A021] to-transparent" />
            <div className="pointer-events-none absolute right-4 top-4 h-12 w-12 rounded-full border border-[#E34B34]/40 [background:repeating-radial-gradient(circle_at_center,transparent_0,transparent_5px,#E34B3433_6px,#E34B3433_7px)]" />
            {call ? (
              <>
                <p className="text-[10px] font-semibold tracking-[0.28em] text-[#F2A021]">{hud.clutch ? 'ÚLTIMA VENTANA' : `TRANSMISIÓN ${String(call.id + 1).padStart(2, '0')}`}</p>
                <p className="mt-3 text-[1.7rem] font-black leading-[0.96] tracking-tight sm:text-3xl">{call.prompt}</p>
                <p className="mx-auto mt-3 inline-flex rounded-full border border-[#F4E7CF]/20 bg-[#F4E7CF]/[0.06] px-3 py-1.5 text-sm font-semibold text-[#FFF0D3]">PISTA: {call.clue}</p>
                <div className="mx-auto mt-3 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full ${hud.clutch ? 'bg-[#E34B34]' : 'bg-[#F2A021]'}`}
                    style={{ width: `${Math.min(100, (windowLeft / windowMax) * 100)}%` }}
                  />
                </div>
              </>
            ) : (
              <div className="pt-9">
                <p className="font-[family-name:var(--hud-font)] text-xs tracking-[0.26em] text-[#F2A021]">CENTRAL AURA</p>
                <p className="mt-2 text-base font-semibold text-white/65">Escuchando la siguiente señal…</p>
              </div>
            )}
          </div>

          {learn ? (
            <p className="mx-auto mt-3 max-w-xl rounded-xl border border-[#F2A021]/35 bg-[#F2A021]/10 px-3 py-2 text-center text-xs leading-snug text-[#FFF0D3]">
              PERSONAS → EVACUÁ · AGUA CERCA → AGUA · VIENTO Y MONTE → CORTE
            </p>
          ) : null}

          {hud.juice ? (
            <p
              className={`mt-3 text-center text-2xl font-black ${
                hud.juice === '¡SÍ!' || hud.juice.startsWith('x') ? 'text-[#7DDC68]' : 'text-[#E34B34]'
              }`}
            >
              {hud.juice}
            </p>
          ) : (
            <div className="mt-3 h-8" />
          )}

          <RadioSignalField active={Boolean(call)} clutch={hud.clutch} />

          <div className="mx-auto mt-3 grid w-full max-w-5xl grid-cols-3 gap-2 rounded-[1.65rem] border border-white/10 bg-black/20 p-2">
            {ACTIONS.map((a) => (
              <button
                key={a.id}
                type="button"
                disabled={!call}
                onPointerDown={(event) => {
                  event.preventDefault()
                  pick(a.id)
                }}
                className="min-h-[105px] rounded-[1.1rem] border border-white/20 py-3 text-center font-black shadow-[0_7px_0_rgba(0,0,0,0.23)] transition-transform active:translate-y-1 active:shadow-none disabled:opacity-35"
                style={{ background: a.color, color: '#0A0A0F' }}
              >
                <span className="block text-lg tracking-wide">{a.label}</span>
                <span className="mt-0.5 block text-[10px] font-semibold opacity-85">{a.rule}</span>
                <span className="mt-2 block border-t border-black/15 pt-1 font-[family-name:var(--hud-font)] text-[10px]">{a.hint}</span>
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

function RadioSignalField({ active, clutch }: { active: boolean; clutch: boolean }) {
  const glow = clutch ? '#E34B34' : '#19C37D'
  return (
    <div className="relative mx-auto flex min-h-[9rem] w-full max-w-3xl flex-1 items-center justify-center overflow-hidden md:min-h-[18rem]" aria-hidden>
      <div
        className="absolute h-44 w-44 rounded-full border opacity-70 md:h-80 md:w-80"
        style={{ borderColor: `${glow}44`, boxShadow: `0 0 44px ${glow}18` }}
      />
      <div className="absolute h-28 w-28 rounded-full border border-[#F2A021]/20 md:h-52 md:w-52" />
      <div className="absolute h-14 w-14 rounded-full border border-[#F4E7CF]/20 bg-[#0D1210]/50 md:h-28 md:w-28" />
      <div className="relative flex flex-col items-center">
        <svg width="96" height="44" viewBox="0 0 96 44" fill="none">
          <path d="M1 24h10l6-13 9 24 9-32 9 34 9-19 8 6h12l6-12 8 12h8" stroke={glow} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="mt-2 font-[family-name:var(--hud-font)] text-[10px] tracking-[0.28em]" style={{ color: active ? '#F2A021' : '#F4E7CF88' }}>
          {active ? 'SEÑAL ABIERTA' : 'ESPERANDO SEÑAL'}
        </p>
      </div>
    </div>
  )
}
