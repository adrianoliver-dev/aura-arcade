'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'

import { humoCopy } from '@/lib/humo/copy'
import {
  FREEZE_MS,
  FOCO_N,
  MATCH_MS,
  TICK_MS,
  astar,
  assetCells,
  createWorld,
  incidentAt,
  normOfCell,
  resolveIncident,
  simulateRun,
  strokeOnRoad,
  type Incident,
  type Stroke,
  type World,
} from '@/lib/humo/sim'
import {
  humoMission,
  loadIdentity,
  loadPersonalBest,
  loadPlays,
  savePersonalBest,
  type HumoMission,
} from '@/lib/pulso/camba'
import type { BoardEntry } from '@/lib/pulso/types'

import {
  getPulsoMuteSnapshot,
  playHumoClutch,
  playHumoSave,
  playHumoWhoosh,
  playPulsoSfx,
  resetPulsoRushFlag,
  setPulsoMuted,
  subscribePulsoMute,
  unlockPulsoAudio,
} from '@/components/pulso/pulso-audio'

import { ArcadeHud } from '@/components/arcade/arcade-hud'
import { ArcadeReady } from '@/components/arcade/arcade-ready'
import { saveGameBest } from '@/lib/arcade/liga'
import { addXp, xpFromScore } from '@/lib/arcade/progress'
import { useDemoRematch } from '@/lib/arcade/use-demo-rematch'
import { HumoEndScreen } from './humo-end-screen'
import {
  drawFrame,
  gridLayout,
  spawnBurst,
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

function snapTol(incidentId: number): number {
  if (incidentId <= 0) return 0.058
  if (incidentId === 1) return 0.034
  return 0.02
}

function nearFocus(pt: { x: number; y: number }, inc: Incident, world: World): boolean {
  const focus = normOfCell(inc.focus)
  const dx = pt.x - focus.x
  const dy = pt.y - focus.y
  const tol = snapTol(inc.id)
  if (dx * dx + dy * dy <= tol) return true
  const cells = assetCells(world, inc)
  for (const cell of cells) {
    const cx = (cell.c + 0.5) / world.cols
    const cy = (cell.r + 0.5) / world.rows
    const ex = pt.x - cx
    const ey = pt.y - cy
    if (ex * ex + ey * ey <= tol * 0.72) return true
  }
  return false
}

type Props = {
  demo?: boolean
  challengeSeed?: number | null
}

export function HumoGame({ demo = false, challengeSeed = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const worldRef = useRef<World | null>(null)
  const phaseRef = useRef<Phase>('boot')
  const tRef = useRef(0)
  const strokesRef = useRef<Stroke[]>([])
  const drawingRef = useRef<Stroke | null>(null)
  const tokenRef = useRef<string | null>(null)
  const seedRef = useRef(0)
  const juiceRef = useRef<Juice[]>([])
  const particlesRef = useRef<Particle[]>([])
  const floatersRef = useRef<Floater[]>([])
  const accRef = useRef(0)
  const lastRef = useRef(0)
  const lastHudRef = useRef(0)
  const lastPreviewRef = useRef(0)
  const identityRef = useRef({ alias: 'Yacare', tag: 'SCZ' })
  const layoutRef = useRef<GridLayout>({ ox: 0, oy: 0, cell: 1, gridW: 1, gridH: 1 })
  const missedRef = useRef(new Set<number>())
  const savedRef = useRef<SavedCell[]>([])
  const ghostRef = useRef<{ c: number; r: number }[]>([])
  const announcedRef = useRef(new Set<number>())
  const clutchRef = useRef(new Set<number>())
  const rachaRef = useRef(0)
  const shakeRef = useRef(0)
  const flashRef = useRef(0)
  const flashTintRef = useRef<FlashTint>('fire')
  const shocksRef = useRef<Shock[]>([])
  const onRoadRef = useRef(true)
  const runnerRef = useRef<{ points: { x: number; y: number }[]; born: number } | null>(null)
  const demoDrawRef = useRef<{ id: number; points: { x: number; y: number }[]; born: number } | null>(null)
  const movedRef = useRef(false)
  const downPtRef = useRef<{ x: number; y: number } | null>(null)
  const [grabbing, setGrabbing] = useState(false)

  const muted = useSyncExternalStore(subscribePulsoMute, getPulsoMuteSnapshot, () => false)

  const [phase, setPhase] = useState<Phase>('boot')
  const [identity, setIdentity] = useState({ alias: '', tag: 'SCZ' })
  const [runToken, setRunToken] = useState<string | null>(null)
  const [toBeat, setToBeat] = useState(0)
  const [mission, setMission] = useState<HumoMission | null>(null)
  const [hud, setHud] = useState({
    hectares: 0,
    efficiency: 0,
    left: MATCH_MS,
    foco: 0,
    freeze: false,
    ghost: 0,
    window: 0,
    racha: 0,
    clutch: false,
    windowMax: 1,
    canAct: false,
    saved: 0,
  })
  const [result, setResult] = useState<{
    hectares: number
    efficiency: number
    arrived: number
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

  const pushJuice = (label: string, color: string, scale = 1) => {
    juiceRef.current.push({ label, color, born: performance.now(), scale })
  }

  const resetFx = () => {
    juiceRef.current = []
    particlesRef.current = []
    floatersRef.current = []
    savedRef.current = []
    ghostRef.current = []
    missedRef.current = new Set()
    announcedRef.current = new Set()
    clutchRef.current = new Set()
    rachaRef.current = 0
    shakeRef.current = 0
    flashRef.current = 0
    flashTintRef.current = 'fire'
    shocksRef.current = []
    onRoadRef.current = true
    demoDrawRef.current = null
    drawingRef.current = null
    strokesRef.current = []
    runnerRef.current = null
  }

  const startRun = useCallback(async () => {
    setResult(null)
    setRunToken(null)
    accRef.current = 0
    tRef.current = 0
    tokenRef.current = null
    resetFx()
    resetPulsoRushFlag()
    setMission(humoMission())
    try {
      const boardRes = await fetch('/api/pulso/leaderboard', { cache: 'no-store' })
      if (boardRes.ok) {
        const board = (await boardRes.json()) as { today?: BoardEntry[] }
        setToBeat(board.today?.[0]?.score ?? 0)
      }
    } catch {
      setToBeat(0)
    }
    try {
      const res = await fetch('/api/pulso/run/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(challengeSeed ? { seed: challengeSeed } : {}),
      })
      if (res.ok) {
        const data = (await res.json()) as { seed: number; token: string; runId?: string }
        seedRef.current = data.seed
        tokenRef.current = data.token
        setRunToken(data.token)
        const nextId = loadIdentity(data.runId || String(data.seed))
        identityRef.current = nextId
        setIdentity(nextId)
      } else {
        seedRef.current = challengeSeed || ((Date.now() ^ 0x9e3779b9) >>> 0) || 1
        const nextId = loadIdentity(String(seedRef.current))
        identityRef.current = nextId
        setIdentity(nextId)
      }
    } catch {
      seedRef.current = challengeSeed || ((Date.now() ^ 0x9e3779b9) >>> 0) || 1
      const nextId = loadIdentity(String(seedRef.current))
      identityRef.current = nextId
      setIdentity(nextId)
    }
    worldRef.current = createWorld(seedRef.current)
    setHud({
      hectares: 0,
      efficiency: 0,
      left: MATCH_MS,
      foco: 0,
      freeze: false,
      ghost: 0,
      window: 0,
      racha: 0,
      clutch: false,
      windowMax: 1,
      canAct: false,
      saved: 0,
    })
    setPhaseBoth('ready')
  }, [challengeSeed])

  useEffect(() => {
    const id = window.setTimeout(() => {
      void startRun()
    }, 0)
    return () => window.clearTimeout(id)
  }, [startRun])

  const finish = useCallback(async () => {
    const id = identityRef.current
    const prevBest = loadPersonalBest()
    const localSim = simulateRun(seedRef.current, strokesRef.current)
    const arrived = localSim.savedByIncident.filter((row) => row.arrived).length
    const payload = {
      token: tokenRef.current,
      strokes: strokesRef.current,
      alias: id.alias,
      tag: id.tag,
    }
    const local = {
      hectares: localSim.hectares,
      efficiency: localSim.efficiency,
      arrived,
      rank: null as number | null,
      total: 0,
      gap: 0,
      today: [] as BoardEntry[],
      personalBest: prevBest,
      plays: loadPlays() + 1,
    }
    savePersonalBest(localSim.hectares)
    saveGameBest('humo', localSim.hectares)
    addXp(xpFromScore(localSim.hectares))
    setResult(local)
    try {
      const res = await fetch('/api/pulso/run/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const data = (await res.json()) as {
          score: number
          hectares?: number
          comboMax: number
          efficiency?: number
          arrived?: number
          rank: number
          total: number
          gap: number
          today: BoardEntry[]
        }
        const ha = data.hectares ?? data.score
        setResult({
          hectares: ha,
          efficiency: data.efficiency ?? data.comboMax,
          arrived: data.arrived ?? arrived,
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
          JSON.stringify({ ...payload, score: localSim.hectares, at: Date.now() }),
        )
      } catch {
        /* private mode */
      }
    }
  }, [])

  const commitStroke = useCallback((stroke: Stroke) => {
    const world = worldRef.current
    const layout = layoutRef.current
    if (!world) return
    if (strokesRef.current.some((s) => s.incident === stroke.incident)) return
    strokesRef.current = [...strokesRef.current, stroke]
    drawingRef.current = null
    demoDrawRef.current = null
    ghostRef.current = []
    runnerRef.current = { points: stroke.points, born: performance.now() }
    const inc = world.incidents[stroke.incident]
    if (!inc) return
    const resolved = resolveIncident(world, inc, stroke)
    const focus = {
      x: layout.ox + ((inc.focus.c + 0.5) / world.cols) * layout.gridW,
      y: layout.oy + ((inc.focus.r + 0.5) / world.rows) * layout.gridH,
    }
    if (resolved.arrived && resolved.saved > 0) {
      rachaRef.current += 1
      playHumoSave(resolved.saved)
      const big = resolved.saved >= 22 || resolved.efficiency >= 0.9
      pushJuice(big ? humoCopy.juice.SAVE_BIG : humoCopy.juice.SAVE, '#7DDC68', big ? 1.35 : 1.12)
      if (rachaRef.current === 2) pushJuice(humoCopy.juice.STREAK2, '#F2A021', 1.2)
      if (rachaRef.current === 3) pushJuice(humoCopy.juice.STREAK3, '#C4B5FD', 1.45)
      if (strokeOnRoad(world, stroke)) pushJuice(humoCopy.juice.ROAD, '#C4B5FD', 0.9)
      try {
        navigator.vibrate?.(big ? 36 : 22)
      } catch {
        /* desktop */
      }
      const now = performance.now()
      const simNow = simulateRun(seedRef.current, strokesRef.current)
      for (const cell of resolved.cells) {
        const delay = (Math.abs(cell.c - world.node.c) + Math.abs(cell.r - world.node.r)) * 22
        savedRef.current.push({ ...cell, born: now, delay })
      }
      particlesRef.current.push(...spawnBurst(focus.x, focus.y, '#C4B5FD', 28, 1.8))
      particlesRef.current.push(...spawnBurst(focus.x, focus.y, '#7DDC68', 18, 1.1))
      particlesRef.current.push(...spawnBurst(focus.x, focus.y, '#FFFFFF', 8, 0.55))
      shocksRef.current.push({ x: focus.x, y: focus.y, born: now, color: big ? '#7DDC68' : '#C4B5FD' })
      floatersRef.current.push({
        text: humoCopy.plusHa(resolved.saved),
        x: focus.x,
        y: focus.y - 16,
        born: now,
        color: '#7DDC68',
      })
      shakeRef.current = big ? 16 : 10
      flashRef.current = big ? 0.48 : 0.36
      flashTintRef.current = 'save'
      setHud((prev) => ({
        ...prev,
        hectares: simNow.hectares,
        efficiency: simNow.efficiency,
        ghost: 0,
        racha: rachaRef.current,
      }))
    } else if (resolved.arrived) {
      rachaRef.current = 0
      playPulsoSfx('casi')
      pushJuice(humoCopy.juice.ARRIVE, '#F2A021', 1.1)
      shakeRef.current = 6
      flashRef.current = 0.18
      flashTintRef.current = 'fire'
      particlesRef.current.push(...spawnBurst(focus.x, focus.y, '#F2A021', 12, 0.9))
      shocksRef.current.push({ x: focus.x, y: focus.y, born: performance.now(), color: '#F2A021' })
    } else {
      rachaRef.current = 0
      playPulsoSfx('miss')
      pushJuice(humoCopy.juice.MISS, '#E34B34', 1.15)
      shakeRef.current = 11
      flashRef.current = 0.28
      flashTintRef.current = 'miss'
      particlesRef.current.push(...spawnBurst(focus.x, focus.y, '#E34B34', 14, 1.1))
      try {
        navigator.vibrate?.(48)
      } catch {
        /* desktop */
      }
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
    setHud({
      hectares: 0,
      efficiency: 0,
      left: MATCH_MS,
      foco: 0,
      freeze: false,
      ghost: 0,
      window: 0,
      racha: 0,
      clutch: false,
      windowMax: 1,
      canAct: false,
      saved: 0,
    })
    setPhaseBoth('play')
  }, [])

  const eventToNorm = (event: { clientX: number; clientY: number }) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const layout = layoutRef.current
    const x = (event.clientX - rect.left - layout.ox) / layout.gridW
    const y = (event.clientY - rect.top - layout.oy) / layout.gridH
    return {
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y)),
    }
  }

  const cancelDraw = () => {
    drawingRef.current = null
    ghostRef.current = []
    movedRef.current = false
    downPtRef.current = null
    setGrabbing(false)
  }

  const finishDraw = useCallback(() => {
    const drawing = drawingRef.current
    if (!drawing || phaseRef.current !== 'play') return
    drawing.t1 = tRef.current
    const world = worldRef.current
    const inc = world?.incidents[drawing.incident]
    const last = drawing.points[drawing.points.length - 1]
    if (!movedRef.current || drawing.points.length < 4 || !inc || !last || !world) {
      cancelDraw()
      pushJuice(humoCopy.coach, '#F2A021', 0.95)
      return
    }
    if (!nearFocus(last, inc, world)) {
      cancelDraw()
      pushJuice(humoCopy.cancelHint, '#F2A021', 0.95)
      return
    }
    drawing.points.push(normOfCell(inc.focus))
    movedRef.current = false
    downPtRef.current = null
    setGrabbing(false)
    commitStroke(drawing)
  }, [commitStroke])

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault()
    void unlockPulsoAudio()
    if (event.pointerType === 'mouse' && event.button !== 0) return
    if (phaseRef.current === 'ready') beginPlay()
    if (phaseRef.current !== 'play' || demo) return
    if (tRef.current >= FREEZE_MS) return
    const world = worldRef.current
    if (!world) return
    const inc = incidentAt(tRef.current, world)
    if (!inc) {
      pushJuice(humoCopy.coachWait, '#F2A021', 0.95)
      return
    }
    if (strokesRef.current.some((s) => s.incident === inc.id)) return
    if (drawingRef.current) return
    const pt = eventToNorm(event)
    if (!pt) return
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      /* jsdom / overlay */
    }
    movedRef.current = false
    downPtRef.current = pt
    drawingRef.current = {
      incident: inc.id,
      points: [normOfCell(inc.node), pt],
      t0: tRef.current,
      t1: tRef.current,
    }
    setGrabbing(true)
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
      if (ox * ox + oy * oy > 0.0012) movedRef.current = true
    }
    const last = drawing.points[drawing.points.length - 1]
    if (last) {
      const dx = pt.x - last.x
      const dy = pt.y - last.y
      if (dx * dx + dy * dy < 0.00016) return
    }
    if (drawing.points.length >= 96) return
    drawing.points.push(pt)
    drawing.t1 = tRef.current
    playHumoWhoosh()
    const layout = layoutRef.current
    particlesRef.current.push({
      x: layout.ox + pt.x * layout.gridW,
      y: layout.oy + pt.y * layout.gridH,
      vx: 0,
      vy: -0.35,
      life: 0.7,
      color: onRoadRef.current ? '#C4B5FD' : '#F2A021',
      size: 2.2,
    })
  }

  const onPointerUp = () => {
    finishDraw()
  }

  const onPointerCancel = () => {
    if (!drawingRef.current) return
    cancelDraw()
    pushJuice(humoCopy.cancelHint, '#F2A021', 0.9)
  }

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
      layoutRef.current = gridLayout(w, h)
      let clutch = false

      if (phaseRef.current === 'play' && worldRef.current) {
        if (!lastRef.current) lastRef.current = now
        accRef.current += now - lastRef.current
        lastRef.current = now
        while (accRef.current >= TICK_MS && tRef.current < MATCH_MS) {
          accRef.current -= TICK_MS
          tRef.current += TICK_MS
        }
        const t = tRef.current
        const world = worldRef.current
        const inc = incidentAt(t, world)
        clutch = Boolean(inc && inc.commitMs - t < 3200 && inc.commitMs - t > 0)

        if (inc && !announcedRef.current.has(inc.id)) {
          announcedRef.current.add(inc.id)
          playPulsoSfx('doble')
          shakeRef.current = 7
          flashRef.current = 0.26
          flashTintRef.current = 'fire'
          const layout = layoutRef.current
          const fx = layout.ox + ((inc.focus.c + 0.5) / world.cols) * layout.gridW
          const fy = layout.oy + ((inc.focus.r + 0.5) / world.rows) * layout.gridH
          particlesRef.current.push(...spawnBurst(fx, fy, '#FF6A1A', 22, 1.45))
          shocksRef.current.push({ x: fx, y: fy, born: now, color: '#FF6A1A' })
          try {
            navigator.vibrate?.(12)
          } catch {
            /* desktop */
          }
        }

        if (inc && clutch && !clutchRef.current.has(inc.id) && !strokesRef.current.some((s) => s.incident === inc.id)) {
          clutchRef.current.add(inc.id)
          playHumoClutch()
          pushJuice(humoCopy.juice.CLUTCH, '#E34B34', 1.1)
        }

        for (const row of world.incidents) {
          if (t >= row.commitMs && !strokesRef.current.some((s) => s.incident === row.id) && !missedRef.current.has(row.id)) {
            missedRef.current.add(row.id)
            if (drawingRef.current?.incident === row.id) drawingRef.current = null
            ghostRef.current = []
            rachaRef.current = 0
            playPulsoSfx('brecha')
            pushJuice(humoCopy.juice.FIRE, '#E34B34', 1.22)
            shakeRef.current = 12
            flashRef.current = 0.3
            flashTintRef.current = 'miss'
          }
        }

        const drawing = drawingRef.current
        if (drawing && inc && now - lastPreviewRef.current > 50) {
          lastPreviewRef.current = now
          drawing.t1 = t
          onRoadRef.current = strokeOnRoad(world, drawing)
          const preview = resolveIncident(world, inc, drawing)
          ghostRef.current = preview.cells
          setHud((prev) => ({ ...prev, ghost: preview.saved }))
        } else if (!drawing && ghostRef.current.length) {
          ghostRef.current = []
        }

        if (demo && inc && !strokesRef.current.some((s) => s.incident === inc.id)) {
          if (!demoDrawRef.current || demoDrawRef.current.id !== inc.id) {
            const path = astar(world, inc.node, inc.focus) ?? [inc.node, inc.focus]
            demoDrawRef.current = { id: inc.id, points: path.map(normOfCell), born: t }
          }
          const demoDraw = demoDrawRef.current
          if (demoDraw) {
            const u = Math.min(1, (t - demoDraw.born) / 780)
            const n = Math.max(2, Math.floor(u * demoDraw.points.length))
            drawingRef.current = {
              incident: inc.id,
              points: demoDraw.points.slice(0, n),
              t0: demoDraw.born,
              t1: t,
            }
            if (u >= 1) {
              commitStroke({
                incident: inc.id,
                points: demoDraw.points,
                t0: demoDraw.born,
                t1: t,
              })
            }
          }
        }

        if (t >= FREEZE_MS && drawingRef.current) {
          commitStroke({ ...drawingRef.current, t1: FREEZE_MS })
        }
        if (t >= FREEZE_MS && !missedRef.current.has(99)) {
          missedRef.current.add(99)
          playPulsoSfx('rush')
          pushJuice(humoCopy.juice.CUT, '#C4B5FD', 1.2)
        }

        if (t >= MATCH_MS && phaseRef.current === 'play') {
          if (demo) {
            window.setTimeout(() => {
              void startRun()
            }, 1100)
            setPhaseBoth('boot')
          } else {
            setPhaseBoth('end')
            void finish()
          }
        }

        if (now - lastHudRef.current > 80) {
          lastHudRef.current = now
          setHud((prev) => ({
            hectares: prev.hectares,
            efficiency: prev.efficiency,
            left: Math.max(0, MATCH_MS - t),
            foco: inc ? inc.id + 1 : t >= FREEZE_MS ? FOCO_N : 0,
            freeze: t >= FREEZE_MS,
            ghost: drawingRef.current ? prev.ghost : 0,
            window: inc ? Math.max(0, inc.commitMs - t) : 0,
            windowMax: inc ? Math.max(1, inc.commitMs - inc.appearMs) : 1,
            racha: rachaRef.current,
            clutch,
            canAct: Boolean(
              inc && t < FREEZE_MS && !strokesRef.current.some((s) => s.incident === inc.id),
            ),
            saved: strokesRef.current.length,
          }))
        }
      } else {
        lastRef.current = now
      }

      particlesRef.current = stepParticles(particlesRef.current)
      if (particlesRef.current.length > 200) particlesRef.current = particlesRef.current.slice(-200)
      shakeRef.current *= 0.82
      flashRef.current *= 0.86
      juiceRef.current = juiceRef.current.filter((j) => now - j.born < 1400)
      floatersRef.current = floatersRef.current.filter((f) => now - f.born < 1100)
      shocksRef.current = shocksRef.current.filter((s) => now - s.born < 560)

      const liveWorld = worldRef.current
      const liveInc = liveWorld ? incidentAt(tRef.current, liveWorld) : null
      const canAct = Boolean(
        liveInc && tRef.current < FREEZE_MS && !strokesRef.current.some((s) => s.incident === liveInc.id),
      )
      const tutorial = Boolean(canAct && liveInc && liveInc.id === 0 && !drawingRef.current)
      const guide =
        tutorial && liveWorld && liveInc
          ? (astar(liveWorld, liveInc.node, liveInc.focus) ?? []).map(normOfCell)
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
        shake: shakeRef.current,
        flash: flashRef.current,
        flashTint: flashTintRef.current,
        onRoad: onRoadRef.current,
        clutch,
        hint: tutorial,
        canAct,
        guide,
        runner: runnerRef.current,
      })

      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      alive = false
      cancelAnimationFrame(raf)
    }
  }, [commitStroke, demo, finish, startRun])

  useEffect(() => {
    if (!demo || phase !== 'ready') return
    const id = window.setTimeout(() => beginPlay(), 1400)
    return () => window.clearTimeout(id)
  }, [beginPlay, demo, phase])

  useDemoRematch(demo, phase, () => {
    void startRun()
  })

  useEffect(() => {
    const onUp = () => finishDraw()
    const onCancel = () => {
      if (!drawingRef.current) return
      drawingRef.current = null
      ghostRef.current = []
      movedRef.current = false
      downPtRef.current = null
      setGrabbing(false)
    }
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onCancel)
    return () => {
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onCancel)
    }
  }, [finishDraw])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return
      event.preventDefault()
      void unlockPulsoAudio()
      if (phaseRef.current === 'ready') beginPlay()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [beginPlay])

  return (
    <div className="relative h-full w-full">
      <canvas
        ref={canvasRef}
        role="application"
        aria-label="Arrastrá del nodo verde al fuego naranja"
        className={`block h-full w-full touch-none ${grabbing ? 'cursor-grabbing' : 'cursor-crosshair'}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onContextMenu={(event) => event.preventDefault()}
      />
      {phase === 'ready' ? (
        <ArcadeReady
          kicker="ANTES DEL HUMO"
          title={humoCopy.hint}
          body="Arrastrá del nodo verde al fuego. Salvás hectáreas."
          cue={humoCopy.draw}
          accent="#16B57D"
          toBeat={toBeat}
          onStart={beginPlay}
        />
      ) : null}

      {phase === 'play' ? (
        <ArcadeHud
          score={hud.hectares}
          unit={humoCopy.ha}
          timeMs={hud.left}
          accent="#16B57D"
          clutch={hud.clutch}
          left={
            <>
              {hud.ghost > 0 ? (
                <p className="text-sm font-black text-[#7DDC68]">{humoCopy.ghostHa(hud.ghost)}</p>
              ) : null}
              {hud.racha > 1 ? (
                <p className="text-sm font-black text-[#C4B5FD]">
                  {humoCopy.racha}
                  {hud.racha}
                </p>
              ) : null}
            </>
          }
          right={
            <>
              <p className="mt-1 text-[11px] text-[#16B57D]">
                {hud.saved}/{FOCO_N}
              </p>
              {hud.freeze ? <p className="font-black tracking-wide text-[#C4B5FD]">{humoCopy.juice.CUT}</p> : null}
            </>
          }
        />
      ) : null}

      {phase === 'play' && hud.window > 0 && !hud.freeze ? (
        <div className="pointer-events-none absolute inset-x-8 top-[4.6rem] h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full ${hud.clutch ? 'bg-[#E34B34]' : 'bg-[#F2A021]'}`}
            style={{ width: `${Math.min(100, (hud.window / hud.windowMax) * 100)}%` }}
          />
        </div>
      ) : null}

      {phase === 'play' && !hud.freeze && !grabbing ? (
        <div className="pointer-events-none absolute inset-x-4 bottom-16 z-10 text-center">
          {hud.canAct && hud.foco === 1 ? (
            <p className="text-sm font-black tracking-wide text-[#F2A021]">{humoCopy.coach}</p>
          ) : hud.canAct && hud.foco === 3 ? (
            <p className="text-xs font-black tracking-wide text-[#E34B34]">Último</p>
          ) : hud.canAct && hud.foco === 2 ? (
            <p className="text-xs font-semibold text-white/60">{humoCopy.coachDrag}</p>
          ) : hud.foco === 0 ? (
            <p className="text-sm font-semibold text-white/70">{humoCopy.coachWait}</p>
          ) : null}
        </div>
      ) : null}

      {demo ? null : (
      <button
        type="button"
        className="absolute bottom-4 right-4 z-10 min-h-11 rounded-full border border-white/20 bg-black/40 px-3 py-1.5 text-[11px] uppercase tracking-wide"
        onClick={(event) => {
          event.stopPropagation()
          setPulsoMuted(!muted)
          void unlockPulsoAudio()
        }}
      >
        {muted ? humoCopy.mute : humoCopy.sound}
      </button>
      )}

      {phase === 'end' && result ? (
        <HumoEndScreen
          hectares={result.hectares}
          efficiency={result.efficiency}
          arrived={result.arrived}
          rank={result.rank}
          total={result.total}
          gap={result.gap}
          today={result.today}
          personalBest={result.personalBest}
          plays={result.plays}
          toBeat={toBeat}
          mission={mission}
          seed={seedRef.current}
          initialAlias={identity.alias}
          initialTag={identity.tag}
          runToken={demo ? null : runToken}
          onRematch={() => void startRun()}
        />
      ) : null}
    </div>
  )
}
