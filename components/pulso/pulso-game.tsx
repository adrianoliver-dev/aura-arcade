'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'

import {
  dailyMission,
  loadIdentity,
  loadPersonalBest,
  loadPlays,
  savePersonalBest,
  type DailyMission,
} from '@/lib/pulso/camba'
import { pulsoCopy } from '@/lib/pulso/copy'
import {
  CX,
  CY,
  ISLAND_R,
  MATCH_MS,
  RING_MAX,
  RING_MIN,
  RING_THICK,
  RUSH_START_MS,
  TICK_MS,
  comboMultiplier,
  countKind,
  createSim,
  shouldAutoTap,
  stepSim,
  tapSim,
  waveAt,
  type PulseEvent,
  type SimState,
} from '@/lib/pulso/sim'
import type { BoardEntry } from '@/lib/pulso/types'

import {
  getPulsoMuteSnapshot,
  playPulsoRush,
  playPulsoSfx,
  resetPulsoRushFlag,
  setPulsoMuted,
  sfxFromKind,
  subscribePulsoMute,
  unlockPulsoAudio,
} from './pulso-audio'
import { PulsoEndScreen } from './pulso-end-screen'
import { ArcadeHud } from '@/components/arcade/arcade-hud'
import { ArcadeReady } from '@/components/arcade/arcade-ready'
import { saveGameBest } from '@/lib/arcade/liga'
import { addXp, xpFromScore } from '@/lib/arcade/progress'

type Phase = 'boot' | 'ready' | 'play' | 'end'

type Juice = {
  label: string
  color: string
  born: number
}

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}

type Props = {
  demo?: boolean
}

const LABEL_COLOR: Record<string, string> = {
  PERFECT: '#7DDC68',
  DOBLE: '#F2A021',
  CASI: '#1F9ED8',
  BRECHA: '#E34B34',
  MISS: '#70757F',
}

export function PulsoGame({ demo = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<SimState | null>(null)
  const phaseRef = useRef<Phase>('boot')
  const tapsRef = useRef<number[]>([])
  const tokenRef = useRef<string | null>(null)
  const seedRef = useRef(0)
  const juiceRef = useRef<Juice[]>([])
  const particlesRef = useRef<Particle[]>([])
  const shakeRef = useRef(0)
  const accRef = useRef(0)
  const lastRef = useRef(0)
  const lastHudRef = useRef(0)
  const identityRef = useRef({ alias: 'Yacare', tag: 'SCZ' })
  const waveRef = useRef('')

  const muted = useSyncExternalStore(subscribePulsoMute, getPulsoMuteSnapshot, () => false)

  const [phase, setPhase] = useState<Phase>('boot')
  const [identity, setIdentity] = useState({ alias: '', tag: 'SCZ' })
  const [runToken, setRunToken] = useState<string | null>(null)
  const [toBeat, setToBeat] = useState(0)
  const [mission, setMission] = useState<DailyMission | null>(null)
  const [hud, setHud] = useState({
    score: 0,
    combo: 0,
    left: MATCH_MS,
    rush: false,
    kills: 0,
    wave: '',
  })
  const [result, setResult] = useState<{
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
  } | null>(null)

  const setPhaseBoth = (next: Phase) => {
    phaseRef.current = next
    setPhase(next)
  }

  const boom = (state: SimState, event: PulseEvent) => {
    juiceRef.current.push({
      label: pulsoCopy.juice[event.kind] ?? event.kind,
      color: LABEL_COLOR[event.kind] ?? '#fff',
      born: performance.now(),
    })
    playPulsoSfx(sfxFromKind(event.kind))
    try {
      if (event.kind === 'BRECHA') navigator.vibrate?.(40)
      else if (event.kind !== 'MISS') navigator.vibrate?.(12)
    } catch {
      /* desktop */
    }
    if (event.kind === 'MISS') return
    const n = event.kind === 'BRECHA' ? 10 : 8 + event.n * 4
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * Math.PI * 2
      const sp = 0.002 + (i % 5) * 0.0008
      particlesRef.current.push({
        x: CX,
        y: CY,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
        life: 1,
        color: event.kind === 'BRECHA' ? '#E34B34' : '#F2A021',
      })
    }
    if (event.kind === 'BRECHA') shakeRef.current = 10
    else if (event.kind === 'PERFECT' || event.kind === 'DOBLE') shakeRef.current = 5
  }

  const startRun = useCallback(async () => {
    setResult(null)
    setRunToken(null)
    tapsRef.current = []
    juiceRef.current = []
    particlesRef.current = []
    accRef.current = 0
    tokenRef.current = null
    waveRef.current = ''
    resetPulsoRushFlag()
    setMission(dailyMission())
    try {
      const boardRes = await fetch('/api/anillos/leaderboard', { cache: 'no-store' })
      if (boardRes.ok) {
        const board = (await boardRes.json()) as { today?: BoardEntry[] }
        setToBeat(board.today?.[0]?.score ?? 0)
      }
    } catch {
      setToBeat(0)
    }
    try {
      const res = await fetch('/api/anillos/run/start', { method: 'POST' })
      if (res.ok) {
        const data = (await res.json()) as { seed: number; token: string; runId?: string }
        seedRef.current = data.seed
        tokenRef.current = data.token
        setRunToken(data.token)
        const nextId = loadIdentity(data.runId || String(data.seed))
        identityRef.current = nextId
        setIdentity(nextId)
      }
    } catch {
      seedRef.current = (Date.now() ^ 0x9e3779b9) >>> 0
      const nextId = loadIdentity(String(seedRef.current))
      identityRef.current = nextId
      setIdentity(nextId)
    }
    stateRef.current = createSim(seedRef.current)
    setHud({ score: 0, combo: 0, left: MATCH_MS, rush: false, kills: 0, wave: waveAt(0).label })
    setPhaseBoth('ready')
  }, [])

  useEffect(() => {
    const id = window.setTimeout(() => {
      void startRun()
    }, 0)
    return () => window.clearTimeout(id)
  }, [startRun])

  const finish = useCallback(async (state: SimState) => {
    const id = identityRef.current
    const prevBest = loadPersonalBest()
    const payload = {
      token: tokenRef.current,
      taps: tapsRef.current,
      alias: id.alias,
      tag: id.tag,
    }
    const local = {
      score: state.score,
      comboMax: state.comboMax,
      kills: state.kills,
      perfects: countKind(state.events, 'PERFECT'),
      breaches: countKind(state.events, 'BRECHA'),
      rank: null as number | null,
      total: 0,
      gap: 0,
      today: [] as BoardEntry[],
      personalBest: prevBest,
      plays: 1,
    }
    try {
      const res = await fetch('/api/anillos/run/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const data = (await res.json()) as {
          score: number
          comboMax: number
          kills?: number
          rank: number
          total: number
          gap: number
          today: BoardEntry[]
        }
        savePersonalBest(data.score)
        setResult({
          score: data.score,
          comboMax: data.comboMax,
          kills: data.kills ?? state.kills,
          perfects: local.perfects,
          breaches: local.breaches,
          rank: data.rank,
          total: data.total,
          gap: data.gap,
          today: data.today ?? [],
          personalBest: prevBest,
          plays: loadPlays(),
        })
        return
      }
    } catch {
      try {
        localStorage.setItem(
          'pulso:pending',
          JSON.stringify({ ...payload, score: state.score, at: Date.now() }),
        )
      } catch {
        /* private mode */
      }
    }
    savePersonalBest(state.score)
    saveGameBest('anillos', state.score)
    addXp(xpFromScore(state.score))
    setResult({ ...local, plays: loadPlays() })
  }, [])

  const beginPlay = useCallback(() => {
    if (phaseRef.current !== 'ready') return
    void unlockPulsoAudio()
    stateRef.current = createSim(seedRef.current)
    tapsRef.current = []
    accRef.current = 0
    lastRef.current = performance.now()
    setPhaseBoth('play')
  }, [])

  const onPulse = useCallback(() => {
    void unlockPulsoAudio()
    if (phaseRef.current === 'ready') {
      beginPlay()
      return
    }
    if (phaseRef.current !== 'play' || !stateRef.current) return
    const event = tapSim(stateRef.current)
    tapsRef.current.push(stateRef.current.t)
    boom(stateRef.current, event)
  }, [beginPlay])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let raf = 0
    let alive = true

    const loop = (now: number) => {
      if (!alive) return
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
        canvas.width = Math.floor(w * dpr)
        canvas.height = Math.floor(h * dpr)
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      if (phaseRef.current === 'play' && stateRef.current) {
        if (!lastRef.current) lastRef.current = now
        accRef.current += now - lastRef.current
        lastRef.current = now
        const state = stateRef.current
        while (accRef.current >= TICK_MS && !state.finished) {
          accRef.current -= TICK_MS
          const breaches = stepSim(state, TICK_MS)
          for (const event of breaches) boom(state, event)
          if (demo && shouldAutoTap(state)) {
            const event = tapSim(state)
            tapsRef.current.push(state.t)
            boom(state, event)
          }
        }
        if (state.t >= RUSH_START_MS) playPulsoRush()
        const wave = waveAt(state.t)
        if (wave.label !== waveRef.current) {
          waveRef.current = wave.label
        }
        if (state.finished && phaseRef.current === 'play') {
          if (demo) {
            window.setTimeout(() => {
              void startRun()
            }, 900)
            setPhaseBoth('boot')
          } else {
            setPhaseBoth('end')
            void finish(state)
          }
        }
        if (now - lastHudRef.current > 90) {
          lastHudRef.current = now
          setHud({
            score: state.score,
            combo: state.streak,
            left: Math.max(0, MATCH_MS - state.t),
            rush: state.t >= RUSH_START_MS,
            kills: state.kills,
            wave: wave.label,
          })
        }
      } else {
        lastRef.current = now
      }

      drawFrame(ctx, w, h, {
        state: stateRef.current,
        phase: phaseRef.current,
        now,
        juice: juiceRef.current,
        particles: particlesRef.current,
        shake: shakeRef.current,
      })
      shakeRef.current *= 0.82
      juiceRef.current = juiceRef.current.filter((j) => now - j.born < 700)
      for (const p of particlesRef.current) {
        p.x += p.vx * 16
        p.y += p.vy * 16
        p.life -= 0.035
      }
      particlesRef.current = particlesRef.current.filter((p) => p.life > 0)

      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      alive = false
      cancelAnimationFrame(raf)
    }
  }, [demo, finish, startRun])

  useEffect(() => {
    if (!demo || phase !== 'ready') return
    const id = window.setTimeout(() => beginPlay(), 1400)
    return () => window.clearTimeout(id)
  }, [beginPlay, demo, phase])

  return (
    <div className="relative h-full w-full">
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        onPointerDown={(event) => {
          event.preventDefault()
          onPulse()
        }}
      />
      {phase === 'ready' ? (
        <ArcadeReady
          kicker={pulsoCopy.title}
          title={pulsoCopy.hint}
          body={pulsoCopy.ghost}
          cue={pulsoCopy.tap}
          accent="#F2A021"
          mission={mission ? `${pulsoCopy.mission}: ${mission.label}` : undefined}
          toBeat={toBeat}
          interactive={false}
        />
      ) : null}

      {phase === 'play' ? (
        <ArcadeHud
          score={hud.score}
          timeMs={hud.left}
          accent="#F2A021"
          clutch={hud.rush}
          left={
            <>
              <p className="text-[11px] text-[#F2A021]">
                {pulsoCopy.focos} {hud.kills}
              </p>
              {hud.combo > 0 ? (
                <p className="text-[#F2A021]">
                  {pulsoCopy.combo} ×{comboMultiplier(hud.combo).toFixed(1)}
                </p>
              ) : null}
            </>
          }
          right={
            <>
              <p className="mt-1 text-[11px] text-[#16B57D]">{hud.wave}</p>
              {hud.rush ? <p className="font-black tracking-wide text-[#E34B34]">{pulsoCopy.rush}</p> : null}
            </>
          }
        />
      ) : null}

      <button
        type="button"
        className="absolute bottom-4 right-4 z-10 rounded-full border border-white/20 bg-black/40 px-3 py-1.5 text-[11px] uppercase tracking-wide"
        onClick={(event) => {
          event.stopPropagation()
          setPulsoMuted(!muted)
          void unlockPulsoAudio()
        }}
      >
        {muted ? pulsoCopy.mute : pulsoCopy.sound}
      </button>

      {phase === 'end' && result ? (
        <PulsoEndScreen
          score={result.score}
          comboMax={result.comboMax}
          kills={result.kills}
          perfects={result.perfects}
          breaches={result.breaches}
          rank={result.rank}
          total={result.total}
          gap={result.gap}
          today={result.today}
          personalBest={result.personalBest}
          plays={result.plays}
          toBeat={toBeat}
          mission={mission}
          initialAlias={identity.alias}
          initialTag={identity.tag}
          runToken={demo ? null : runToken}
          onRematch={() => void startRun()}
        />
      ) : null}
    </div>
  )
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  opts: {
    state: SimState | null
    phase: Phase
    now: number
    juice: Juice[]
    particles: Particle[]
    shake: number
  },
) {
  const size = Math.min(w, h)
  const t = opts.state?.t ?? 0
  const wave = waveAt(t)
  const shake = opts.shake
  const ox = (w - size) / 2 + (shake ? ((opts.now * 0.37) % 1) * shake - shake / 2 : 0)
  const oy = (h - size) / 2 + (shake ? ((opts.now * 0.53) % 1) * shake - shake / 2 : 0)
  const S = (v: number) => v * size
  const cx = ox + S(CX)
  const cy = oy + S(CY)

  const night = ctx.createRadialGradient(cx, cy, S(0.04), cx, cy, S(0.78))
  if (wave.id === 'noche') {
    night.addColorStop(0, '#4a1c12')
    night.addColorStop(0.45, '#1a0e0c')
    night.addColorStop(1, '#0A0A0F')
  } else if (wave.id === 'chaco') {
    night.addColorStop(0, '#2a2410')
    night.addColorStop(0.55, '#12180f')
    night.addColorStop(1, '#0A0A0F')
  } else if (wave.id === 'norte') {
    night.addColorStop(0, '#1c3328')
    night.addColorStop(0.55, '#0d1a14')
    night.addColorStop(1, '#0A0A0F')
  } else {
    night.addColorStop(0, '#163325')
    night.addColorStop(0.55, '#0d1a14')
    night.addColorStop(1, '#0A0A0F')
  }
  ctx.fillStyle = night
  ctx.fillRect(0, 0, w, h)

  ctx.save()
  ctx.strokeStyle = 'rgba(22,181,125,0.08)'
  ctx.lineWidth = 1
  for (let i = 1; i < 10; i++) {
    ctx.beginPath()
    ctx.moveTo(ox + (size * i) / 10, oy)
    ctx.lineTo(ox + (size * i) / 10, oy + size)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(ox, oy + (size * i) / 10)
    ctx.lineTo(ox + size, oy + (size * i) / 10)
    ctx.stroke()
  }
  ctx.restore()

  const sweep = ((opts.now / 2800) % 1) * Math.PI * 2
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(sweep)
  const radar = ctx.createLinearGradient(0, 0, S(0.48), 0)
  radar.addColorStop(0, 'rgba(22,181,125,0)')
  radar.addColorStop(1, wave.id === 'noche' ? 'rgba(227,75,52,0.22)' : 'rgba(22,181,125,0.16)')
  ctx.fillStyle = radar
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.arc(0, 0, S(0.48), -0.18, 0.18)
  ctx.closePath()
  ctx.fill()
  ctx.restore()

  ctx.save()
  ctx.strokeStyle = 'rgba(22,181,125,0.16)'
  ctx.lineWidth = 1
  for (const r of [0.16, 0.26, 0.36, 0.46]) {
    ctx.beginPath()
    ctx.arc(cx, cy, S(r), 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.restore()

  ctx.save()
  ctx.fillStyle = 'rgba(217,220,225,0.45)'
  ctx.font = `700 ${Math.floor(size * 0.028)}px ui-sans-serif, system-ui`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('N', cx, cy - S(0.49))
  ctx.fillText('S', cx, cy + S(0.49))
  ctx.fillText('E', cx + S(0.49), cy)
  ctx.fillText('O', cx - S(0.49), cy)
  ctx.restore()

  const island = ctx.createRadialGradient(cx, cy, S(0.01), cx, cy, S(ISLAND_R))
  island.addColorStop(0, '#9BE88A')
  island.addColorStop(0.55, '#16B57D')
  island.addColorStop(1, '#0d3d2c')
  ctx.fillStyle = island
  ctx.beginPath()
  ctx.arc(cx, cy, S(ISLAND_R), 0, Math.PI * 2)
  ctx.fill()
  ctx.save()
  ctx.strokeStyle = 'rgba(10,40,24,0.35)'
  ctx.lineWidth = 1
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath()
    ctx.moveTo(cx - S(0.05), cy + S(i * 0.018))
    ctx.lineTo(cx + S(0.05), cy + S(i * 0.018))
    ctx.stroke()
  }
  ctx.restore()
  ctx.fillStyle = '#F2A021'
  ctx.fillRect(cx - S(0.01), cy - S(0.028), S(0.02), S(0.02))
  ctx.strokeStyle = 'rgba(125,220,104,0.7)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(cx, cy, S(ISLAND_R), 0, Math.PI * 2)
  ctx.stroke()

  ctx.save()
  ctx.fillStyle = 'rgba(242,160,33,0.7)'
  ctx.font = `800 ${Math.floor(size * 0.022)}px ui-sans-serif, system-ui`
  ctx.textAlign = 'center'
  ctx.fillText('FEXPOCRUZ', cx, cy + S(ISLAND_R + 0.028))
  ctx.restore()

  let ringR = RING_MIN
  if (opts.phase === 'ready') {
    const u = (Math.sin(opts.now / 420) + 1) / 2
    ringR = RING_MIN + u * (RING_MAX - RING_MIN) * 0.55
  } else if (opts.state) {
    ringR = opts.state.ringR
  }

  ctx.beginPath()
  ctx.arc(cx, cy, S(ringR), 0, Math.PI * 2)
  ctx.strokeStyle = wave.id === 'noche' ? '#E34B34' : '#16B57D'
  ctx.lineWidth = Math.max(3, S(RING_THICK) * 0.55)
  ctx.shadowColor = wave.id === 'noche' ? '#E34B34' : '#16B57D'
  ctx.shadowBlur = 18
  ctx.stroke()
  ctx.shadowBlur = 0

  if (opts.state) {
    for (const ember of opts.state.embers) {
      if (!ember.alive) continue
      const x = ox + S(ember.x)
      const y = oy + S(ember.y)
      const g = ctx.createRadialGradient(x, y, 0, x, y, S(0.034))
      g.addColorStop(0, '#fff3c4')
      g.addColorStop(0.3, '#F2A021')
      g.addColorStop(1, 'rgba(227,75,52,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(x, y, S(0.034), 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#E34B34'
      ctx.beginPath()
      ctx.moveTo(x, y - S(0.012))
      ctx.lineTo(x + S(0.01), y)
      ctx.lineTo(x, y + S(0.012))
      ctx.lineTo(x - S(0.01), y)
      ctx.closePath()
      ctx.fill()
    }
  }

  for (const p of opts.particles) {
    ctx.globalAlpha = Math.max(0, p.life)
    ctx.fillStyle = p.color
    ctx.beginPath()
    ctx.arc(ox + S(p.x), oy + S(p.y), 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
  }

  for (const j of opts.juice) {
    const age = opts.now - j.born
    ctx.globalAlpha = Math.max(0, 1 - age / 700)
    ctx.fillStyle = j.color
    ctx.font = `800 ${Math.floor(size * 0.052)}px ui-sans-serif, system-ui`
    ctx.textAlign = 'center'
    ctx.fillText(j.label, cx, cy - S(0.2) - age * 0.04)
    ctx.globalAlpha = 1
  }
}
