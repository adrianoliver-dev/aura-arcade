'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'

import { ArcadeEnd } from '@/components/arcade/arcade-end'
import { playHumoClutch, playHumoSave, playPulsoSfx, unlockPulsoAudio } from '@/components/pulso/pulso-audio'
import { loadGameBest, saveGameBest } from '@/lib/arcade/liga'
import { useDemoRematch } from '@/lib/arcade/use-demo-rematch'
import { loadIdentity } from '@/lib/pulso/camba'
import type { BoardEntry } from '@/lib/pulso/types'
import {
  MATCH_MS,
  ROUND_CALLS,
  buildCalls,
  liveCall,
  radioTitle,
  simulateRun,
  type Action,
  type Call,
  type Decision,
} from '@/lib/radio/sim'

type Phase = 'intro' | 'brief' | 'play' | 'end'
type Feedback = { kind: 'ok' | 'miss' | 'late'; label: string } | null

const ACTIONS: Array<{ id: Action; label: string; verb: string; tone: string }> = [
  { id: 'agua', label: 'AGUA', verb: 'Contené el foco', tone: '#2E9FD6' },
  { id: 'corte', label: 'CORTE', verb: 'Abrí una franja', tone: '#F2A021' },
  { id: 'evacua', label: 'EVACUÁ', verb: 'Mové la zona', tone: '#EC5A45' },
]

type Result = {
  score: number
  subtitle: string
  title: string
  rank: number | null
  total: number
  gap: number
  today: BoardEntry[]
  personalBest: number
}

type PreparedRun = { seed: number; token: string | null; identity: { alias: string; tag: string } }

function offlinePrepared(): PreparedRun {
  const seed = (Date.now() ^ 0x51d4e5) >>> 0 || 1
  return { seed, token: null, identity: loadIdentity(String(seed)) }
}

export function RadioGameV2({ demo = false, standalone = false }: { demo?: boolean; standalone?: boolean }) {
  const phaseRef = useRef<Phase>('intro')
  const preparedRef = useRef<PreparedRun>(offlinePrepared())
  const seedRef = useRef(preparedRef.current.seed)
  const tokenRef = useRef<string | null>(preparedRef.current.token)
  const callsRef = useRef<Call[]>(buildCalls(seedRef.current))
  const decisionsRef = useRef<Decision[]>([])
  const doneRef = useRef(new Set<number>())
  const endedRef = useRef(false)
  const lockedRef = useRef(false)
  const lastRef = useRef(0)
  const tRef = useRef(0)
  const finishAtRef = useRef<number | null>(null)
  const autoRef = useRef(new Set<number>())
  const [phase, setPhase] = useState<Phase>('intro')
  const [identity, setIdentity] = useState(preparedRef.current.identity)
  const [call, setCall] = useState<Call | null>(null)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [misses, setMisses] = useState(0)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [locked, setLocked] = useState(false)
  const [result, setResult] = useState<Result | null>(null)

  const setPhaseBoth = (next: Phase) => {
    phaseRef.current = next
    setPhase(next)
  }

  const prepareRun = useCallback(async () => {
    const fallback = offlinePrepared()
    preparedRef.current = fallback
    seedRef.current = fallback.seed
    tokenRef.current = null
    callsRef.current = buildCalls(fallback.seed)
    decisionsRef.current = []
    doneRef.current = new Set()
    autoRef.current = new Set()
    endedRef.current = false
    lockedRef.current = false
    finishAtRef.current = null
    tRef.current = 0
    setIdentity(fallback.identity)
    setCall(null)
    setScore(0)
    setStreak(0)
    setMisses(0)
    setFeedback(null)
    setLocked(false)
    setResult(null)
    setPhaseBoth('intro')

    if (demo) return
    try {
      const response = await fetch('/api/radio/run/start', { method: 'POST' })
      if (!response.ok) return
      const data = (await response.json()) as { seed: number; token: string }
      const prepared = { seed: data.seed, token: data.token, identity: loadIdentity(data.token) }
      preparedRef.current = prepared
      // La pantalla no se recarga: se adopta el seed sólo antes de arrancar.
      if (phaseRef.current !== 'play' && phaseRef.current !== 'end') {
        seedRef.current = prepared.seed
        tokenRef.current = prepared.token
        callsRef.current = buildCalls(prepared.seed)
        setIdentity(prepared.identity)
      }
    } catch {
      // La ronda local sigue siendo jugable si el stand pierde red.
    }
  }, [demo])

  useEffect(() => {
    void prepareRun()
  }, [prepareRun])

  const startLiveRound = useCallback(() => {
    const prepared = preparedRef.current
    seedRef.current = prepared.seed
    tokenRef.current = prepared.token
    callsRef.current = buildCalls(prepared.seed)
    setIdentity(prepared.identity)
    tRef.current = 0
    lastRef.current = performance.now()
    setPhaseBoth('play')
  }, [])

  const enterRound = useCallback(() => {
    void unlockPulsoAudio()
    if (phaseRef.current !== 'intro') return
    setPhaseBoth('brief')
    window.setTimeout(startLiveRound, 2_350)
  }, [startLiveRound])

  const finish = useCallback(async () => {
    if (endedRef.current) return
    endedRef.current = true
    const local = simulateRun(seedRef.current, decisionsRef.current)
    const title = radioTitle(local.score, local.saves, local.housesLeft).title
    const previousBest = loadGameBest('radio')
    if (!demo) saveGameBest('radio', local.score)
    const base: Result = {
      score: local.score,
      subtitle: `${local.saves}/${ROUND_CALLS} decisiones acertadas · ${local.misses} señal${local.misses === 1 ? '' : 'es'} perdida${local.misses === 1 ? '' : 's'}`,
      title,
      rank: null,
      total: 0,
      gap: 0,
      today: [],
      personalBest: previousBest,
    }
    setResult(base)
    setPhaseBoth('end')
    if (demo || !tokenRef.current) return
    try {
      const response = await fetch('/api/radio/run/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenRef.current, decisions: decisionsRef.current, alias: identity.alias, tag: identity.tag }),
      })
      if (!response.ok) return
      const data = (await response.json()) as { score: number; rank: number; total: number; gap: number; today: BoardEntry[] }
      setResult({ ...base, score: data.score, rank: data.rank, total: data.total, gap: data.gap, today: data.today ?? [] })
    } catch {
      // El resultado local ya se mostró; no se bloquea la salida por red.
    }
  }, [demo, identity.alias, identity.tag])

  const resolve = useCallback((action: Action, forcedLate = false, expiredCall?: Call) => {
    if (phaseRef.current !== 'play' || lockedRef.current) return
    const active = expiredCall ?? liveCall(tRef.current, callsRef.current, doneRef.current)
    if (!active) return
    lockedRef.current = true
    setLocked(true)
    doneRef.current.add(active.id)
    const ok = !forcedLate && action === active.correct
    if (!forcedLate) decisionsRef.current.push({ id: active.id, action, t: tRef.current })
    try {
      navigator.vibrate?.(ok ? 14 : 38)
    } catch {
      /* unsupported */
    }
    if (ok) {
      playHumoSave(active.stake)
      setStreak((current) => {
        const next = current + 1
        const speed = (tRef.current - active.appearMs) / Math.max(1, active.commitMs - active.appearMs)
        const speedBonus = speed <= 0.34 ? 12 : speed <= 0.64 ? 6 : 0
        setScore((value) => value + active.stake + speedBonus + Math.min(next - 1, 4) * 4)
        setFeedback({ kind: 'ok', label: next >= 3 ? `RACHA ×${next}` : 'LECTURA CLARA' })
        return next
      })
    } else {
      playPulsoSfx(forcedLate ? 'brecha' : 'miss')
      setStreak(0)
      setMisses((value) => value + 1)
      setFeedback({ kind: forcedLate ? 'late' : 'miss', label: forcedLate ? 'SEÑAL PERDIDA' : 'ORDEN EQUIVOCADA' })
    }
    window.setTimeout(() => {
      lockedRef.current = false
      setLocked(false)
      setFeedback(null)
    }, 560)
    if (doneRef.current.size === callsRef.current.length) finishAtRef.current = performance.now() + 820
  }, [])

  useEffect(() => {
    const host = window as Window & {
      __radioGuide?: () => { phase: Phase; clue: string | null; prompt: string | null; correct: Action | null; label: string | null }
    }
    host.__radioGuide = () => {
      const active = liveCall(tRef.current, callsRef.current, doneRef.current)
      return {
        phase: phaseRef.current,
        clue: active?.clue ?? null,
        prompt: active?.prompt ?? null,
        correct: active?.correct ?? null,
        label: active ? ACTIONS.find((row) => row.id === active.correct)?.label ?? null : null,
      }
    }
    return () => {
      delete host.__radioGuide
    }
  }, [])

  useEffect(() => {
    if (phase !== 'play') return
    lastRef.current = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const dt = Math.min(40, now - lastRef.current)
      lastRef.current = now
      tRef.current = Math.min(MATCH_MS, tRef.current + dt)
      const active = liveCall(tRef.current, callsRef.current, doneRef.current)
      setCall(active)
      if (active && active.commitMs - tRef.current < 1_200 && active.commitMs - tRef.current > 1_160) playHumoClutch()
      for (const candidate of callsRef.current) {
        if (tRef.current >= candidate.commitMs && !doneRef.current.has(candidate.id)) {
          resolve(candidate.correct === 'agua' ? 'corte' : 'agua', true, candidate)
          break
        }
      }
      if (demo && active && !autoRef.current.has(active.id) && tRef.current > active.appearMs + 1_250) {
        autoRef.current.add(active.id)
        resolve(active.correct)
      }
      if (finishAtRef.current != null && now >= finishAtRef.current) {
        void finish()
        return
      }
      if (tRef.current >= MATCH_MS) {
        void finish()
        return
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [demo, finish, phase, resolve])

  useEffect(() => {
    if (!demo || phase !== 'intro') return
    const timer = window.setTimeout(() => enterRound(), 950)
    return () => window.clearTimeout(timer)
  }, [demo, enterRound, phase])

  useDemoRematch(demo, phase, () => void prepareRun())

  useEffect(() => {
    const keyboard = (event: KeyboardEvent) => {
      if (phaseRef.current === 'intro' && event.key === 'Enter') enterRound()
      if (phaseRef.current !== 'play') return
      if (event.key === '1') resolve('agua')
      if (event.key === '2') resolve('corte')
      if (event.key === '3') resolve('evacua')
    }
    window.addEventListener('keydown', keyboard)
    return () => window.removeEventListener('keydown', keyboard)
  }, [enterRound, resolve])

  const progress = call ? ((call.id + 1) / ROUND_CALLS) * 100 : (doneRef.current.size / ROUND_CALLS) * 100
  const perSignal = call ? Math.max(0, Math.min(1, (call.commitMs - tRef.current) / Math.max(1, call.commitMs - call.appearMs))) : 0
  const urgent = perSignal > 0 && perSignal < 0.26

  return (
    <main className="relative h-full overflow-hidden bg-[#09120F] text-[#F8ECD7]">
      <RadioStyle />
      <RadioTerrain action={call?.correct ?? null} urgent={urgent} />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(5,13,10,.22),rgba(5,13,10,.22)_44%,rgba(5,13,10,.94))]" />

      {phase === 'intro' ? <RadioIntro onStart={enterRound} showExit={standalone} /> : null}
      {phase === 'brief' ? <RadioBrief /> : null}

      {phase === 'play' ? (
        <div className="relative z-10 flex h-full flex-col px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(.75rem,env(safe-area-inset-top))] sm:px-5">
          <header className="flex items-center justify-between gap-3">
            {standalone ? <Link href="/lab" className="min-h-11 rounded-full border border-[#F8ECD7]/25 bg-[#0A1611]/75 px-3 text-[10px] font-semibold tracking-[.16em] text-[#F8ECD7] backdrop-blur-md">← SALA</Link> : <span className="w-16" aria-hidden />}
            <div className="min-w-32 text-center">
              <p className="font-[family-name:var(--hud-font)] text-[10px] tracking-[.28em] text-[#F2A021]">CENTRAL AURA</p>
              <p className="mt-0.5 text-sm font-black">SEÑAL {Math.min(ROUND_CALLS, doneRef.current.size + 1)} / {ROUND_CALLS}</p>
            </div>
            <div className="min-w-16 rounded-full border border-[#F8ECD7]/15 bg-[#0A1611]/72 px-3 py-2 text-right backdrop-blur-md">
              <p className="text-[9px] tracking-[.16em] text-[#F8ECD7]/52">PUNTOS</p>
              <p className="text-xl font-black leading-none tabular-nums text-[#F2A021]">{score}</p>
            </div>
          </header>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-black/35" aria-label={`Progreso ${Math.round(progress)}%`}>
            <div className="h-full bg-gradient-to-r from-[#19C37D] via-[#F2A021] to-[#EC5A45] transition-[width] duration-300" style={{ width: `${progress}%` }} />
          </div>

          <section className="relative mx-auto mt-3 flex w-full max-w-5xl flex-1 flex-col justify-end sm:justify-center">
            <div className="mx-auto grid w-full max-w-3xl gap-3 sm:grid-cols-[1fr_1.35fr]">
              <RadioScope action={call?.correct ?? null} progress={perSignal} urgent={urgent} />
              <article className="relative overflow-hidden rounded-[1.65rem] border border-[#F8ECD7]/17 bg-[#111B15]/[.88] p-5 shadow-[0_22px_72px_rgba(0,0,0,.38)] backdrop-blur-md sm:p-7">
                <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#F2A021] to-transparent" />
                {call ? (
                  <>
                    <p className={`font-[family-name:var(--hud-font)] text-[10px] tracking-[.28em] ${urgent ? 'text-[#EC5A45]' : 'text-[#F2A021]'}`}>
                      {urgent ? 'DECIDÍ AHORA' : `TRANSMISIÓN ${String(call.id + 1).padStart(2, '0')}`}
                    </p>
                    <h1 className="mt-3 text-[clamp(1.65rem,5vw,2.7rem)] font-black leading-[.98] tracking-[-.04em]">{call.prompt}</h1>
                    <p className="mt-4 inline-flex rounded-full border border-[#F8ECD7]/15 bg-black/15 px-3 py-1.5 text-xs font-medium tracking-wide text-[#F8ECD7]/76">{call.clue}</p>
                    <p className="mt-5 text-sm leading-snug text-[#F8ECD7]/58">Elegí la orden que cambia primero esta situación.</p>
                  </>
                ) : (
                  <div className="py-7">
                    <p className="font-[family-name:var(--hud-font)] text-[10px] tracking-[.28em] text-[#19C37D]">ENLACE ABIERTO</p>
                    <p className="mt-3 text-2xl font-black">Buscando la siguiente señal…</p>
                  </div>
                )}
              </article>
            </div>

            <div className="relative mx-auto mt-3 h-8 text-center" aria-live="polite">
              {feedback ? <p className={`text-lg font-black tracking-wide ${feedback.kind === 'ok' ? 'text-[#7DDD69]' : 'text-[#EC5A45]'}`}>{feedback.label}</p> : streak > 1 ? <p className="text-sm font-black text-[#F2A021]">RACHA ×{streak}</p> : null}
            </div>
          </section>

          <nav className="relative z-20 mx-auto mt-1 grid w-full max-w-4xl grid-cols-3 gap-2 rounded-[1.35rem] border border-[#F8ECD7]/14 bg-[#07100C]/80 p-2 backdrop-blur-xl sm:gap-3 sm:p-3" aria-label="Órdenes de radio">
            {ACTIONS.map((action, index) => (
              <button
                key={action.id}
                type="button"
                disabled={!call || locked}
                onPointerDown={(event) => {
                  event.preventDefault()
                  resolve(action.id)
                }}
                className="group min-h-[104px] rounded-[1rem] border border-white/18 px-2 py-3 text-left shadow-[0_8px_0_rgba(0,0,0,.3)] transition duration-150 active:translate-y-1 active:shadow-none disabled:pointer-events-none disabled:opacity-45 sm:min-h-[116px] sm:px-4"
                style={{ background: `linear-gradient(145deg, ${action.tone}, color-mix(in srgb, ${action.tone} 65%, #07100C))`, color: '#07100C' }}
              >
                <span className="flex items-center justify-between"><ActionIcon action={action.id} /><kbd className="hidden rounded border border-black/20 px-1.5 py-0.5 text-[9px] font-bold sm:block">{index + 1}</kbd></span>
                <span className="mt-2 block text-base font-black tracking-wide sm:text-lg">{action.label}</span>
                <span className="mt-0.5 block text-[10px] font-semibold opacity-75 sm:text-xs">{action.verb}</span>
              </button>
            ))}
          </nav>
          <p className="relative z-10 mt-2 text-center text-[10px] tracking-[.12em] text-[#F8ECD7]/42">UNA ORDEN POR SEÑAL · SIN RECARGAS</p>
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
          onRematch={() => void prepareRun()}
        />
      ) : null}
    </main>
  )
}

function RadioIntro({ onStart, showExit }: { onStart: () => void; showExit: boolean }) {
  return (
    <section className="relative z-10 flex h-full flex-col justify-end px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-8 sm:justify-center sm:px-10">
      {showExit ? <Link href="/lab" className="absolute left-5 top-[max(1rem,env(safe-area-inset-top))] min-h-11 rounded-full border border-[#F8ECD7]/28 bg-[#09120F]/58 px-3 py-3 text-[10px] font-semibold tracking-[.16em] text-[#F8ECD7] backdrop-blur-md">← SALA</Link> : null}
      <div className="max-w-xl">
        <p className="font-[family-name:var(--hud-font)] text-[11px] tracking-[.34em] text-[#19C37D]">AURA ARCADE · RADIO ROJA</p>
        <h1 className="mt-4 text-[clamp(3rem,9vw,5.8rem)] font-black leading-[.84] tracking-[-.065em] text-[#F8ECD7]">LEÉ LA<br /><span className="text-[#F2A021]">SEÑAL.</span><br />DECIDÍ.</h1>
        <p className="mt-5 max-w-md text-base leading-relaxed text-[#F8ECD7]/74">Siete transmisiones. Una decisión por señal. No hay trucos: protegé lo que importa primero.</p>
        <div className="mt-6 flex flex-wrap gap-2 text-[10px] font-semibold tracking-[.12em] text-[#F8ECD7]/76">
          <span className="rounded-full border border-[#2E9FD6]/50 bg-[#2E9FD6]/14 px-3 py-2">CONTENER</span>
          <span className="rounded-full border border-[#F2A021]/50 bg-[#F2A021]/14 px-3 py-2">CORTAR AVANCE</span>
          <span className="rounded-full border border-[#EC5A45]/50 bg-[#EC5A45]/14 px-3 py-2">MOVER A TIEMPO</span>
        </div>
        <button type="button" onClick={onStart} className="mt-7 min-h-14 w-full max-w-sm rounded-2xl bg-[#F2A021] px-6 text-base font-black tracking-[.16em] text-[#09120F] shadow-[0_12px_38px_#F2A02166] transition hover:brightness-110 active:translate-y-0.5">SINTONIZAR · 7 SEÑALES</button>
        <p className="mt-3 text-[11px] text-[#F8ECD7]/45">Una ronda de menos de un minuto · audio recomendado</p>
      </div>
    </section>
  )
}

function RadioBrief() {
  return (
    <section className="relative z-10 flex h-full items-center justify-center px-5 text-center">
      <div className="max-w-md rounded-[1.75rem] border border-[#F8ECD7]/18 bg-[#0B1610]/82 p-7 shadow-2xl backdrop-blur-xl">
        <p className="font-[family-name:var(--hud-font)] text-[10px] tracking-[.3em] text-[#19C37D]">CALIBRANDO CENTRAL</p>
        <h2 className="mt-3 text-3xl font-black leading-none">PRIORIZÁ, NO ADIVINÉS.</h2>
        <p className="mt-4 text-sm leading-relaxed text-[#F8ECD7]/72">Personas atrapadas piden salida. Un foco contenido se frena. Un frente que corre necesita una franja.</p>
        <div className="radio-count mt-5 flex items-center justify-center gap-2 text-[#F2A021]" aria-label="La primera señal está por entrar"><i /><i /><i /></div>
      </div>
    </section>
  )
}

function RadioScope({ action, progress, urgent }: { action: Action | null; progress: number; urgent: boolean }) {
  const tone = action === 'agua' ? '#2E9FD6' : action === 'corte' ? '#F2A021' : action === 'evacua' ? '#EC5A45' : '#19C37D'
  const dash = 289
  return (
    <div className="relative min-h-44 overflow-hidden rounded-[1.65rem] border border-[#F8ECD7]/12 bg-[#0A1510]/[.82] shadow-[0_20px_60px_rgba(0,0,0,.28)] sm:min-h-64">
      <div className="radio-grid absolute inset-0 opacity-45" />
      <div className="radio-sweep absolute inset-y-0 w-1/2" style={{ background: `linear-gradient(90deg, transparent, ${tone}22, transparent)` }} />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 320 220" aria-hidden>
        <path d="M-6 174 C66 157 73 111 137 116 S225 49 334 70" fill="none" stroke="#C9905266" strokeWidth="10" strokeLinecap="round" />
        <path d="M-6 174 C66 157 73 111 137 116 S225 49 334 70" fill="none" stroke="#E4B27488" strokeWidth="2" strokeLinecap="round" />
        <path d="M30 42 C93 73 128 55 180 88 S245 164 308 141" fill="none" stroke="#F8ECD733" strokeWidth="2" strokeDasharray="4 7" />
        <circle cx="224" cy="75" r="31" fill={`${tone}18`} stroke={tone} strokeWidth="2" className={urgent ? 'radio-urgent' : undefined} />
        <circle cx="224" cy="75" r="9" fill={tone} />
        <path d="M202 108 C216 94 233 94 246 110" fill="none" stroke="#F8ECD7AA" strokeWidth="2" strokeLinecap="round" />
        <path d="M51 159 C79 147 97 153 111 174" fill="none" stroke="#19C37D88" strokeWidth="8" strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <svg width="128" height="128" viewBox="0 0 110 110" className="drop-shadow-[0_0_22px_rgba(0,0,0,.5)]" aria-hidden>
          <circle cx="55" cy="55" r="46" fill="#07100CCC" stroke="#F8ECD733" strokeWidth="2" />
          <circle cx="55" cy="55" r="46" fill="none" stroke={urgent ? '#EC5A45' : tone} strokeWidth="5" strokeLinecap="round" strokeDasharray={dash} strokeDashoffset={dash * (1 - progress)} transform="rotate(-90 55 55)" />
          <path d="M16 56h13l7-16 10 34 10-46 9 39 8-19 9 8h13" fill="none" stroke="#F8ECD7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <p className="absolute bottom-3 left-0 right-0 text-center font-[family-name:var(--hud-font)] text-[9px] tracking-[.24em] text-[#F8ECD7]/56">{urgent ? 'VENTANA FINAL' : 'SEÑAL ENTRANTE'}</p>
    </div>
  )
}

function RadioTerrain({ action, urgent }: { action: Action | null; urgent: boolean }) {
  const tone = action === 'agua' ? '#2E9FD6' : action === 'corte' ? '#F2A021' : action === 'evacua' ? '#EC5A45' : '#19C37D'
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="radio-sky absolute inset-0" />
      <svg className="absolute inset-0 h-full w-full opacity-85" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="radio-ground" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#31502C" /><stop offset="1" stopColor="#0C2118" /></linearGradient>
          <radialGradient id="radio-bloom"><stop stopColor={tone} stopOpacity=".72" /><stop offset="1" stopColor={tone} stopOpacity="0" /></radialGradient>
        </defs>
        <rect y="234" width="1440" height="666" fill="url(#radio-ground)" />
        <path d="M-40 610 C240 490 355 720 630 555 S1090 470 1490 600" fill="none" stroke="#AD7845" strokeWidth="45" opacity=".56" />
        <path d="M-40 610 C240 490 355 720 630 555 S1090 470 1490 600" fill="none" stroke="#E4AF70" strokeWidth="3" opacity=".65" />
        {[90, 210, 348, 555, 780, 1010, 1220, 1370].map((x, index) => <ellipse key={x} cx={x} cy={340 + ((index * 97) % 370)} rx={44 + (index % 3) * 17} ry={15 + (index % 2) * 8} fill="#173D24" opacity=".9" />)}
        <circle cx="920" cy="420" r={urgent ? 215 : 165} fill="url(#radio-bloom)" className={urgent ? 'radio-urgent' : undefined} />
        <circle cx="920" cy="420" r="18" fill={tone} />
        <path d="M904 438l-44 55m60-48 30 72m-4-77 64 26" stroke={tone} strokeWidth="5" strokeLinecap="round" opacity=".7" />
      </svg>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_65%_44%,transparent_0,rgba(5,12,9,.1)_28%,rgba(5,12,9,.65)_90%)]" />
    </div>
  )
}

function ActionIcon({ action }: { action: Action }) {
  if (action === 'agua') return <svg width="25" height="25" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M12 3s-6 6.5-6 11a6 6 0 0 0 12 0c0-4.5-6-11-6-11Z" stroke="currentColor" strokeWidth="2" /><path d="M9.5 15.5c.5 1.2 1.4 1.8 2.7 1.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
  if (action === 'corte') return <svg width="25" height="25" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M4 19 19 4M6 7l4 4m4 2 4 4" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" /><path d="M4 4h4M16 20h4" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" /></svg>
  return <svg width="25" height="25" viewBox="0 0 24 24" fill="none" aria-hidden><circle cx="9" cy="8" r="2.5" stroke="currentColor" strokeWidth="2" /><circle cx="17" cy="10" r="2" stroke="currentColor" strokeWidth="2" /><path d="M4 20c.5-4 2.1-6 5-6s4.5 2 5 6M14 20c.4-2.7 1.6-4.1 3.5-4.1 1 0 1.8.4 2.5 1.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}

function RadioStyle() {
  return <style>{`
    .radio-sky{background:radial-gradient(ellipse at 72% 6%,#2b4732 0%,#10241b 36%,#07110d 77%)}
    .radio-grid{background-image:linear-gradient(#f8ecd70a 1px,transparent 1px),linear-gradient(90deg,#f8ecd70a 1px,transparent 1px);background-size:22px 22px}
    .radio-sweep{animation:radioSweep 4.8s ease-in-out infinite;filter:blur(2px)}
    .radio-count i{display:block;width:.55rem;height:.55rem;border-radius:999px;background:#f2a021;animation:radioCount 1.1s ease-in-out infinite}.radio-count i:nth-child(2){animation-delay:.18s}.radio-count i:nth-child(3){animation-delay:.36s}
    .radio-urgent{animation:radioUrgent .7s ease-in-out infinite}
    @keyframes radioSweep{0%,100%{transform:translateX(-115%)}50%{transform:translateX(215%)}}
    @keyframes radioCount{0%,100%{transform:scale(.72);opacity:.35}50%{transform:scale(1.2);opacity:1}}
    @keyframes radioUrgent{0%,100%{opacity:.55;transform:scale(.96)}50%{opacity:1;transform:scale(1.04)}}
  `}</style>
}
