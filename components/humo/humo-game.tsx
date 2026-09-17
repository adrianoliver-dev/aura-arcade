'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'

import { BOOT_BUDGET_MS, FETCH_BUDGET_MS, fetchWithTimeout, withTimeout } from '@/lib/arcade/fetch-timeout'
import { humoCopy } from '@/lib/humo/copy'
import {
  FOCO_N,
  MATCH_MS,
  TICK_MS,
  astar,
  createWorld,
  firstGuidePath,
  incidentAt,
  isGuiding,
  isTelegraph,
  normOfCell,
  playSeed,
  previewEta,
  resolveIncident,
  simulateRun,
  snapEnd,
  snapStart,
  type EtaBand,
  type Stroke,
  type World,
} from '@/lib/humo/sim'
import {
  loadIdentity,
  loadPersonalBest,
  savePersonalBest,
} from '@/lib/pulso/camba'
import type { BoardEntry } from '@/lib/pulso/types'
import {
  isPulsoMuted,
  playHumoClutch,
  playHumoSave,
  playHumoWhoosh,
  playPulsoSfx,
  resetPulsoRushFlag,
  setPulsoMuted,
  subscribePulsoMute,
  unlockPulsoAudio,
} from '@/components/pulso/pulso-audio'
import { useDemoRematch } from '@/lib/arcade/use-demo-rematch'
import { HumoEndScreen } from './humo-end-screen'
import {
  drawFrame,
  gridLayout,
  spawnBurst,
  spawnWind,
  stepParticles,
  type FlashTint,
  type Floater,
  type GridLayout,
  type Juice,
  type Particle,
  type SavedCell,
  type Shock,
} from './humo-fx'

type Phase = 'boot' | 'ready' | 'play' | 'end'

type Props = { demo?: boolean; challengeSeed?: number | null }

function rematchCount(): number {
  try {
    return Number(sessionStorage.getItem('humo:rematch') || '0') || 0
  } catch {
    return 0
  }
}

function bumpRematch() {
  try {
    sessionStorage.setItem('humo:rematch', String(rematchCount() + 1))
  } catch {
    /* private */
  }
}

function cacheBoard(today: BoardEntry[]) {
  try {
    localStorage.setItem('humo:board', JSON.stringify({ at: Date.now(), today }))
  } catch {
    /* private */
  }
}

function readCachedBoard(): BoardEntry[] {
  try {
    const raw = localStorage.getItem('humo:board')
    if (!raw) return []
    const parsed = JSON.parse(raw) as { today?: BoardEntry[] }
    return parsed.today ?? []
  } catch {
    return []
  }
}

export function HumoGame({ demo = false, challengeSeed = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const worldRef = useRef<World | null>(null)
  const phaseRef = useRef<Phase>('boot')
  const tRef = useRef(0)
  const strokesRef = useRef<Stroke[]>([])
  const drawingRef = useRef<Stroke | null>(null)
  const seedRef = useRef(1)
  const tokenRef = useRef<string | null>(null)
  const identityRef = useRef({ alias: 'Camba', tag: 'SCZ' })
  const accRef = useRef(0)
  const lastRef = useRef(0)
  const layoutRef = useRef<GridLayout>(gridLayout(390, 700))
  const juiceRef = useRef<Juice[]>([])
  const particlesRef = useRef<Particle[]>([])
  const floatersRef = useRef<Floater[]>([])
  const savedRef = useRef<SavedCell[]>([])
  const ghostRef = useRef<{ c: number; r: number }[]>([])
  const shocksRef = useRef<Shock[]>([])
  const runnerRef = useRef<{ points: { x: number; y: number }[]; born: number } | null>(null)
  const announcedRef = useRef(new Set<number>())
  const clutchRef = useRef(new Set<number>())
  const missedRef = useRef(new Set<number>())
  const downPtRef = useRef<{ x: number; y: number } | null>(null)
  const movedRef = useRef(false)
  const lastPreviewRef = useRef(0)
  const lastHudRef = useRef(0)
  const hectaresRef = useRef(0)
  const etaRef = useRef<EtaBand | null>(null)
  const reducedRef = useRef(false)

  const [phase, setPhase] = useState<Phase>('boot')
  const [runToken, setRunToken] = useState<string | null>(null)
  const [offline, setOffline] = useState(false)
  const [hud, setHud] = useState({ left: MATCH_MS, ha: 0, ghost: 0, canAct: false, clutch: false, line: humoCopy.hint as string })
  const [result, setResult] = useState<{
    hectares: number
    efficiency: number
    arrived: number
    rank: number | null
    total: number
    gap: number
    today: BoardEntry[]
    personalBest: number
    medal: string
  } | null>(null)
  const [toBeat, setToBeat] = useState(0)
  const muted = useSyncExternalStore(subscribePulsoMute, isPulsoMuted, isPulsoMuted)

  const setPhaseBoth = (next: Phase) => {
    phaseRef.current = next
    setPhase(next)
  }

  const pushJuice = (label: string, color: string, scale = 1) => {
    juiceRef.current = [{ label, color, born: performance.now(), scale }, ...juiceRef.current].slice(0, 4)
  }

  const resetFx = () => {
    juiceRef.current = []
    particlesRef.current = []
    floatersRef.current = []
    savedRef.current = []
    ghostRef.current = []
    shocksRef.current = []
    runnerRef.current = null
    announcedRef.current = new Set()
    clutchRef.current = new Set()
    missedRef.current = new Set()
    drawingRef.current = null
    strokesRef.current = []
    hectaresRef.current = 0
    etaRef.current = null
  }

  const startRun = useCallback(async () => {
    setResult(null)
    setRunToken(null)
    tokenRef.current = null
    accRef.current = 0
    tRef.current = 0
    resetFx()
    resetPulsoRushFlag()
    setPhaseBoth('boot')
    const localSeed = challengeSeed || playSeed(Date.now(), rematchCount())
    seedRef.current = localSeed
    identityRef.current = loadIdentity(String(localSeed))
    const cached = readCachedBoard()
    if (cached[0]) setToBeat(cached[0].score)

    const boot = async () => {
      try {
        const boardRes = await fetchWithTimeout('/api/humo/leaderboard', { cache: 'no-store', timeoutMs: FETCH_BUDGET_MS })
        if (boardRes.ok) {
          const board = (await boardRes.json()) as { today?: BoardEntry[] }
          const today = board.today ?? []
          cacheBoard(today)
          setToBeat(today[0]?.score ?? 0)
        }
      } catch {
        /* cache */
      }
      try {
        const res = await fetchWithTimeout('/api/humo/run/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(challengeSeed ? { seed: challengeSeed, rematch: rematchCount() } : { rematch: rematchCount() }),
          timeoutMs: FETCH_BUDGET_MS,
        })
        if (res.ok) {
          const data = (await res.json()) as { seed: number; token: string }
          seedRef.current = data.seed
          tokenRef.current = data.token
          setRunToken(data.token)
          setOffline(false)
          return
        }
      } catch {
        /* local */
      }
      setOffline(true)
    }

    try {
      await withTimeout(boot(), BOOT_BUDGET_MS)
    } catch {
      setOffline(true)
    }
    worldRef.current = createWorld(seedRef.current)
    setHud({ left: MATCH_MS, ha: 0, ghost: 0, canAct: false, clutch: false, line: humoCopy.hint })
    setPhaseBoth('ready')
  }, [challengeSeed])

  useEffect(() => {
    const id = window.setTimeout(() => {
      void startRun()
    }, 0)
    reducedRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    return () => window.clearTimeout(id)
  }, [startRun])

  const finish = useCallback(async () => {
    const prevBest = loadPersonalBest()
    const localSim = simulateRun(seedRef.current, strokesRef.current)
    const arrived = localSim.savedByIncident.filter((row) => row.arrived).length
    savePersonalBest(localSim.hectares)
    const local = {
      hectares: localSim.hectares,
      efficiency: localSim.efficiency,
      arrived,
      rank: null as number | null,
      total: 0,
      gap: 0,
      today: readCachedBoard(),
      personalBest: prevBest,
      medal: localSim.medal,
    }
    setResult(local)
    try {
      const res = await fetchWithTimeout('/api/humo/run/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        timeoutMs: FETCH_BUDGET_MS,
        body: JSON.stringify({
          token: tokenRef.current,
          strokes: strokesRef.current,
          alias: identityRef.current.alias,
          tag: identityRef.current.tag,
        }),
      })
      if (res.ok) {
        const data = (await res.json()) as {
          score: number
          hectares?: number
          efficiency?: number
          comboMax?: number
          arrived?: number
          medal?: string
          rank: number
          total: number
          gap: number
          today: BoardEntry[]
        }
        cacheBoard(data.today ?? [])
        setResult({
          hectares: data.hectares ?? data.score,
          efficiency: data.efficiency ?? data.comboMax ?? localSim.efficiency,
          arrived: data.arrived ?? arrived,
          rank: data.rank,
          total: data.total,
          gap: data.gap,
          today: data.today ?? [],
          personalBest: prevBest,
          medal: data.medal ?? localSim.medal,
        })
      }
    } catch {
      try {
        localStorage.setItem(
          'humo:pending',
          JSON.stringify({ token: tokenRef.current, strokes: strokesRef.current, at: Date.now() }),
        )
      } catch {
        /* private */
      }
    }
  }, [])

  const commitStroke = useCallback((stroke: Stroke) => {
    const world = worldRef.current
    if (!world) return
    const inc = world.incidents[stroke.incident]
    if (!inc) return
    if (strokesRef.current.some((row) => row.incident === stroke.incident)) return
    drawingRef.current = null
    ghostRef.current = []
    strokesRef.current = [...strokesRef.current, stroke]
    const preview = resolveIncident(world, inc, stroke)
    hectaresRef.current += preview.saved
    const layout = layoutRef.current
    const fx = layout.ox + ((inc.focus.c + 0.5) / world.cols) * layout.gridW
    const fy = layout.oy + ((inc.focus.r + 0.5) / world.rows) * layout.gridH
    if (preview.arrived && preview.saved > 0) {
      playHumoSave(preview.saved)
      pushJuice(preview.late ? humoCopy.juice.ARRIVE : humoCopy.juice.SAVE, preview.late ? '#FF9F1C' : '#19C37D', 1.05)
      savedRef.current = [
        ...savedRef.current,
        ...preview.cells.map((cell, i) => ({ ...cell, born: performance.now(), delay: i * 18 })),
      ]
      floatersRef.current.push({ text: humoCopy.plusHa(preview.saved), x: fx, y: fy, born: performance.now(), color: '#19C37D' })
      particlesRef.current.push(...spawnBurst(fx, fy, '#19C37D', 16, 0.9))
      runnerRef.current = { points: stroke.points, born: performance.now() }
    } else {
      playPulsoSfx('miss')
      pushJuice(humoCopy.juice.MISS, '#FF5A36', 1.1)
      particlesRef.current.push(...spawnBurst(fx, fy, '#FF5A36', 12, 0.8))
    }
  }, [])

  const beginPlay = useCallback(() => {
    if (phaseRef.current !== 'ready') return
    void unlockPulsoAudio()
    tRef.current = 0
    accRef.current = 0
    lastRef.current = performance.now()
    resetFx()
    worldRef.current = createWorld(seedRef.current)
    setHud({ left: MATCH_MS, ha: 0, ghost: 0, canAct: false, clutch: false, line: humoCopy.hint })
    setPhaseBoth('play')
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return
      if (phaseRef.current === 'ready') {
        event.preventDefault()
        beginPlay()
        return
      }
      if (phaseRef.current !== 'play' || demo) return
      const world = worldRef.current
      if (!world) return
      const inc = incidentAt(tRef.current, world)
      if (!inc || strokesRef.current.some((s) => s.incident === inc.id)) return
      event.preventDefault()
      const path = inc.id === 0 ? firstGuidePath(world) : [world.node, inc.focus]
      commitStroke({
        incident: inc.id,
        points: path.map(normOfCell),
        t0: tRef.current,
        t1: tRef.current,
      })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [beginPlay, commitStroke, demo])

  const eventToNorm = (event: { clientX: number; clientY: number }) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const layout = layoutRef.current
    const x = (event.clientX - rect.left - layout.ox) / layout.gridW
    const y = (event.clientY - rect.top - layout.oy) / layout.gridH
    return { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) }
  }

  const cancelDraw = () => {
    drawingRef.current = null
    ghostRef.current = []
    movedRef.current = false
    downPtRef.current = null
    etaRef.current = null
  }

  const finishDraw = useCallback(() => {
    const drawing = drawingRef.current
    if (!drawing || phaseRef.current !== 'play') return
    drawing.t1 = tRef.current
    const world = worldRef.current
    const inc = world?.incidents[drawing.incident]
    const last = drawing.points[drawing.points.length - 1]
    if (!movedRef.current || drawing.points.length < 2 || !inc || !last || !world) {
      cancelDraw()
      return
    }
    const end = snapEnd(world, inc, last)
    if (!end.ok) {
      cancelDraw()
      pushJuice(humoCopy.coach, '#FF9F1C', 0.95)
      return
    }
    drawing.points.push(end.snapped)
    commitStroke(drawing)
  }, [commitStroke])

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault()
    if (event.pointerType === 'mouse' && event.button !== 0) return
    if (phaseRef.current === 'ready') beginPlay()
    if (phaseRef.current !== 'play' || demo) return
    const world = worldRef.current
    if (!world || isTelegraph(tRef.current)) return
    const inc = incidentAt(tRef.current, world)
    if (!inc) return
    if (strokesRef.current.some((s) => s.incident === inc.id)) return
    const pt = eventToNorm(event)
    if (!pt) return
    const start = snapStart(world, pt)
    if (!start.ok) {
      pushJuice(humoCopy.coach, '#19C37D', 0.9)
      return
    }
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      /* overlay */
    }
    movedRef.current = false
    downPtRef.current = pt
    drawingRef.current = { incident: inc.id, points: [start.snapped, pt], t0: tRef.current, t1: tRef.current }
  }

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const drawing = drawingRef.current
    if (!drawing || phaseRef.current !== 'play') return
    const pt = eventToNorm(event)
    if (!pt) return
    const origin = downPtRef.current
    if (origin) {
      const ox = pt.x - origin.x
      const oy = pt.y - origin.y
      if (ox * ox + oy * oy > 0.0008) movedRef.current = true
    }
    const last = drawing.points[drawing.points.length - 1]
    if (last) {
      const nx = last.x + (pt.x - last.x) * 0.55
      const ny = last.y + (pt.y - last.y) * 0.55
      if ((nx - last.x) ** 2 + (ny - last.y) ** 2 < 0.00012) return
      if (drawing.points.length >= 96) return
      drawing.points.push({ x: nx, y: ny })
    }
    drawing.t1 = tRef.current
    playHumoWhoosh()
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let alive = true
    let raf = 0
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
      layoutRef.current = gridLayout(w, h)
      let clutch = false
      const world = worldRef.current

      if (phaseRef.current === 'play' && world) {
        if (!lastRef.current) lastRef.current = now
        accRef.current += now - lastRef.current
        lastRef.current = now
        while (accRef.current >= TICK_MS && tRef.current < MATCH_MS) {
          accRef.current -= TICK_MS
          tRef.current += TICK_MS
        }
        const t = tRef.current
        const inc = incidentAt(t, world)
        clutch = Boolean(inc && inc.id === FOCO_N - 1)

        if (inc && !announcedRef.current.has(inc.id)) {
          announcedRef.current.add(inc.id)
          playPulsoSfx('doble')
          const layout = layoutRef.current
          const fx = layout.ox + ((inc.focus.c + 0.5) / world.cols) * layout.gridW
          const fy = layout.oy + ((inc.focus.r + 0.5) / world.rows) * layout.gridH
          particlesRef.current.push(...spawnBurst(fx, fy, '#FF5A36', 18, 1.2))
        }
        if (inc && clutch && !clutchRef.current.has(inc.id) && !strokesRef.current.some((s) => s.incident === inc.id)) {
          clutchRef.current.add(inc.id)
          playHumoClutch()
          pushJuice(humoCopy.juice.CLUTCH, '#FF5A36', 1.1)
        }
        for (const row of world.incidents) {
          if (t >= row.commitMs && !strokesRef.current.some((s) => s.incident === row.id) && !missedRef.current.has(row.id)) {
            missedRef.current.add(row.id)
            if (drawingRef.current?.incident === row.id) drawingRef.current = null
            playPulsoSfx('brecha')
            pushJuice(humoCopy.juice.MISS, '#FF5A36', 1.15)
          }
        }
        const drawing = drawingRef.current
        if (drawing && inc && now - lastPreviewRef.current > 40) {
          lastPreviewRef.current = now
          drawing.t1 = t
          const preview = resolveIncident(world, inc, { ...drawing, points: [...drawing.points, normOfCell(inc.focus)] })
          ghostRef.current = preview.cells
          etaRef.current = previewEta(world, inc, drawing.points, t)
          setHud((prev) => ({ ...prev, ghost: preview.saved }))
        } else if (!drawing) {
          ghostRef.current = []
          etaRef.current = null
        }
        if (!reducedRef.current && now % 3 < 1.5) {
          particlesRef.current.push(...spawnWind(layoutRef.current, world, now))
        }
        if (demo && inc && !strokesRef.current.some((s) => s.incident === inc.id)) {
          const path = (astar(world, inc.node, inc.focus) ?? []).map(normOfCell)
          const born = inc.appearMs + 80
          const u = Math.min(1, (t - born) / 900)
          const n = Math.max(2, Math.floor(u * path.length))
          drawingRef.current = { incident: inc.id, points: path.slice(0, n), t0: born, t1: t }
          if (u >= 1) commitStroke({ incident: inc.id, points: path, t0: born, t1: t })
        }
        if (t >= MATCH_MS && phaseRef.current === 'play') {
          if (demo) {
            window.setTimeout(() => void startRun(), 900)
            setPhaseBoth('boot')
          } else {
            setPhaseBoth('end')
            void finish()
          }
        }
        if (now - lastHudRef.current > 80) {
          lastHudRef.current = now
          const canAct = Boolean(inc && !isTelegraph(t) && !strokesRef.current.some((s) => s.incident === inc.id))
          setHud({
            left: Math.max(0, MATCH_MS - t),
            ha: hectaresRef.current,
            ghost: drawingRef.current ? hud.ghost : 0,
            canAct,
            clutch,
            line: isTelegraph(t)
              ? 'El predio se calienta'
              : isGuiding(t)
                ? 'Del verde al naranja'
                : clutch
                  ? 'Último foco'
                  : 'Base → fuego',
          })
        }
      } else {
        lastRef.current = now
      }

      particlesRef.current = stepParticles(particlesRef.current).slice(-180)
      juiceRef.current = juiceRef.current.filter((j) => now - j.born < 900)
      floatersRef.current = floatersRef.current.filter((f) => now - f.born < 1100)

      const liveWorld = worldRef.current
      const liveInc = liveWorld ? incidentAt(tRef.current, liveWorld) : null
      const canAct = Boolean(liveInc && !isTelegraph(tRef.current) && !strokesRef.current.some((s) => s.incident === liveInc.id))
      const guide =
        liveWorld && liveInc && isGuiding(tRef.current) && !drawingRef.current
          ? firstGuidePath(liveWorld).map(normOfCell)
          : []

      drawFrame(ctx, w, h, {
        world: liveWorld,
        phase: phaseRef.current,
        t: tRef.current,
        now,
        juice: juiceRef.current,
        drawing: drawingRef.current,
        strokes: strokesRef.current,
        saved: savedRef.current,
        ghost: ghostRef.current,
        particles: particlesRef.current,
        floaters: floatersRef.current,
        shocks: shocksRef.current,
        layout: layoutRef.current,
        shake: 0,
        flash: 0,
        flashTint: 'fire' as FlashTint,
        onRoad: true,
        clutch,
        hint: canAct && Boolean(liveInc && liveInc.id === 0),
        canAct,
        guide,
        runner: runnerRef.current,
        eta: etaRef.current,
        reduced: reducedRef.current,
      })
      raf = window.requestAnimationFrame(loop)
    }
    raf = window.requestAnimationFrame(loop)
    return () => {
      alive = false
      window.cancelAnimationFrame(raf)
    }
  }, [commitStroke, demo, finish, hud.ghost, startRun])

  useDemoRematch(demo, phase, () => {
    bumpRematch()
    void startRun()
  })

  const rematch = () => {
    bumpRematch()
    void startRun()
  }

  const seconds = Math.ceil(hud.left / 1000)

  return (
    <div className="relative flex h-full flex-col bg-[#0D1210]">
      <header className="pointer-events-none absolute inset-x-0 top-[max(0.4rem,env(safe-area-inset-top))] z-20 flex items-start justify-between px-4">
        <div className="rounded-2xl bg-[#0D1210]/70 px-3 py-2 text-[#F4E7CF] backdrop-blur-sm">
          <p className="font-display text-4xl leading-none tabular-nums">{seconds}</p>
          <p className="text-sm text-[#C99052]">{hud.ha} ha</p>
        </div>
        <button
          type="button"
          className="pointer-events-auto min-h-12 min-w-12 rounded-full border border-[#C99052]/40 bg-[#0D1210]/80 px-3 text-sm text-[#F4E7CF]"
          onClick={() => setPulsoMuted(!muted)}
        >
          {muted ? humoCopy.mute : humoCopy.sound}
        </button>
      </header>

      <canvas
        ref={canvasRef}
        className="h-[72vh] w-full touch-none md:h-[min(78vh,900px)]"
        style={{ touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishDraw}
        onPointerCancel={cancelDraw}
        aria-label="Predio. Arrastrá desde la base verde hasta el fuego."
      />

      <p className="pointer-events-none absolute bottom-[max(5.5rem,env(safe-area-inset-bottom))] left-0 right-0 text-center text-lg text-[#F4E7CF]">
        {phase === 'play' ? hud.line : phase === 'ready' ? humoCopy.hint : phase === 'boot' ? 'Cargando predio' : ''}
        {offline && phase !== 'end' ? ` · ${humoCopy.offline}` : ''}
      </p>

      {phase === 'ready' && (
        <div className="absolute inset-x-0 bottom-[max(1.2rem,env(safe-area-inset-bottom))] z-20 flex justify-center px-4">
          <button
            type="button"
            onClick={beginPlay}
            className="min-h-14 w-full max-w-sm rounded-full bg-[#19C37D] px-6 font-display text-2xl tracking-wide text-[#0D1210]"
          >
            {humoCopy.cta}
          </button>
        </div>
      )}

      {phase === 'end' && result && (
        <HumoEndScreen
          hectares={result.hectares}
          efficiency={result.efficiency}
          arrived={result.arrived}
          rank={result.rank}
          total={result.total}
          gap={result.gap}
          today={result.today}
          personalBest={result.personalBest}
          medal={result.medal}
          seed={seedRef.current}
          initialAlias={identityRef.current.alias}
          runToken={runToken}
          toBeat={toBeat}
          onRematch={rematch}
        />
      )}
    </div>
  )
}
