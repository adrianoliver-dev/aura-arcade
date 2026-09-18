'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'

import { BOOT_BUDGET_MS, FETCH_BUDGET_MS, fetchWithTimeout, withTimeout } from '@/lib/arcade/fetch-timeout'
import { humoCopy } from '@/lib/humo/copy'
import {
  FOCO_N,
  MATCH_MS,
  TICK_MS,
  astar,
  assetDeadlineMs,
  createWorld,
  firstGuidePath,
  guidePath,
  incidentAt,
  isClutch,
  isTelegraph,
  normOfCell,
  optimalStrokes,
  playSeed,
  previewEta,
  resolveIncident,
  simulateRun,
  snapEnd,
  snapStart,
  type EtaBand,
  type Point,
  type Stroke,
  type World,
} from '@/lib/humo/sim'
import { loadIdentity, loadPersonalBest, savePersonalBest } from '@/lib/pulso/camba'
import type { BoardEntry } from '@/lib/pulso/types'
import { getPulsoMuteSnapshot, setPulsoMuted, subscribePulsoMute } from '@/components/pulso/pulso-audio'
import { playHumoCue, setHumoBedLevel, unlockHumoAudio } from './humo-audio'
import { useDemoRematch } from '@/lib/arcade/use-demo-rematch'
import { HumoEndScreen } from './humo-end-screen'
import {
  drawFrame,
  gridLayout,
  spawnBurst,
  spawnWind,
  stepParticles,
  worldToPx,
  type FlashTint,
  type Floater,
  type GridLayout,
  type Juice,
  type Particle,
  type SavedCell,
  type Shock,
} from './humo-fx'

type Phase = 'boot' | 'ready' | 'play' | 'end'

type Props = { demo?: boolean; challengeSeed?: number | null; rec?: string | null; shot?: string | null }

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

function loadDayBest(): number {
  try {
    return Number(sessionStorage.getItem('humo:day-best') || '0') || 0
  } catch {
    return 0
  }
}

function saveDayBest(ha: number) {
  try {
    const prev = loadDayBest()
    if (ha < prev) return
    sessionStorage.setItem('humo:day-best', String(ha))
  } catch {
    /* private */
  }
}

function tap(ms: number, reduced: boolean) {
  if (reduced) return
  try {
    navigator.vibrate?.(ms)
  } catch {
    /* no haptic */
  }
}

export function HumoGame({ demo = false, challengeSeed = null, rec = null, shot = null }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const worldRef = useRef<World | null>(null)
  const phaseRef = useRef<Phase>('boot')
  const tRef = useRef(0)
  const strokesRef = useRef<Stroke[]>([])
  const drawingRef = useRef<Stroke | null>(null)
  const seedRef = useRef(1)
  const tokenRef = useRef<string | null>(null)
  const identityRef = useRef({ alias: 'Vos', tag: 'SCZ' })
  const accRef = useRef(0)
  const lastRef = useRef(0)
  const layoutRef = useRef<GridLayout>(gridLayout(390, 844))
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
  const haShownRef = useRef(0)
  const etaRef = useRef<EtaBand | null>(null)
  const reducedRef = useRef(false)
  const shakeRef = useRef(0)
  const flashRef = useRef(0)
  const flashTintRef = useRef<FlashTint>('fire')
  const grabAtRef = useRef(0)
  const snapAtRef = useRef(0)
  const dragDistRef = useRef(0)
  const resolvedRef = useRef(new Set<number>())
  const recOnceRef = useRef(false)
  const freezeRef = useRef(false)
  const shotOnceRef = useRef(false)
  const coachRef = useRef('')
  const coachUntilRef = useRef(0)

  const [phase, setPhase] = useState<Phase>('boot')
  const [runToken, setRunToken] = useState<string | null>(null)
  const [offline, setOffline] = useState(false)
  const [hud, setHud] = useState({
    left: MATCH_MS,
    ha: 0,
    ghost: 0,
    canAct: false,
    clutch: false,
    line: humoCopy.hint as string,
    focusIndex: 0,
    focusLabel: '',
    focusLeft: 0,
    focusBudget: 1,
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
    medal: string
    headline: string
    dayBest: number
  } | null>(null)
  const [toBeat, setToBeat] = useState(0)
  const muted = useSyncExternalStore(subscribePulsoMute, getPulsoMuteSnapshot, () => false)

  const setPhaseBoth = (next: Phase) => {
    phaseRef.current = next
    setPhase(next)
  }

  const coach = (line: string, ms = 1_150) => {
    coachRef.current = line
    coachUntilRef.current = performance.now() + ms
    setHud((prev) => ({ ...prev, line }))
  }

  useEffect(() => {
    const host = window as Window & {
      __humoGuide?: () => {
        from: { x: number; y: number }
        to: { x: number; y: number }
        path: { x: number; y: number }[]
        phase: Phase
        t: number
      } | null
    }
    host.__humoGuide = () => {
      const canvas = canvasRef.current
      const world = worldRef.current
      if (!canvas || !world) return null
      const rect = canvas.getBoundingClientRect()
      const layout = layoutRef.current
      const inc =
        incidentAt(tRef.current, world) ??
        world.incidents.find((row) => tRef.current < row.commitMs) ??
        world.incidents[0]
      if (!inc) return null
      const toCss = (p: Point) => {
        const px = worldToPx(layout, p)
        return { x: rect.left + px.x, y: rect.top + px.y }
      }
      const cells = guidePath(world, inc)
      const path = cells.map((cell) => toCss(normOfCell(cell)))
      return {
        from: toCss(normOfCell(inc.node)),
        to: toCss(normOfCell(inc.focus)),
        path,
        phase: phaseRef.current,
        t: tRef.current,
      }
    }
    return () => {
      delete host.__humoGuide
    }
  }, [])

  const pushJuice = (label: string, color: string, scale = 1) => {
    juiceRef.current = [{ label, color, born: performance.now(), scale }, ...juiceRef.current].slice(0, 3)
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
    haShownRef.current = 0
    etaRef.current = null
    shakeRef.current = 0
    flashRef.current = 0
    grabAtRef.current = 0
    snapAtRef.current = 0
    dragDistRef.current = 0
    resolvedRef.current = new Set()
    freezeRef.current = false
    coachRef.current = ''
    coachUntilRef.current = 0
  }

  const startRun = useCallback(async () => {
    setResult(null)
    setRunToken(null)
    tokenRef.current = null
    accRef.current = 0
    tRef.current = 0
    resetFx()
    setPhaseBoth('boot')
    const localSeed = challengeSeed || playSeed(Date.now(), rematchCount())
    seedRef.current = localSeed
    identityRef.current = { alias: 'Ronda', tag: 'SCZ' }
    try {
      if (localStorage.getItem('humo:alias-custom') === '1') {
        identityRef.current = loadIdentity(String(localSeed))
      }
    } catch {
      /* auto */
    }
    const cached = readCachedBoard()
    if (cached[0]) setToBeat(cached[0].score)

    const boot = async () => {
      try {
        const boardRes = await fetchWithTimeout('/api/humo/leaderboard', { cache: 'no-store', timeoutMs: FETCH_BUDGET_MS })
        if (boardRes.ok) {
          const board = (await boardRes.json()) as { today?: BoardEntry[] }
          const today = board.today ?? []
          cacheBoard(today)
          setToBeat(today[0]?.score ?? loadDayBest())
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
    setHud({
      left: MATCH_MS,
      ha: 0,
      ghost: 0,
      canAct: false,
      clutch: false,
      line: humoCopy.hint,
      focusIndex: 0,
      focusLabel: '',
      focusLeft: 0,
      focusBudget: 1,
    })
    setPhaseBoth('ready')
  }, [challengeSeed])

  useEffect(() => {
    const id = window.setTimeout(() => {
      void startRun()
    }, 0)
    reducedRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    return () => window.clearTimeout(id)
  }, [startRun])

  useEffect(() => {
    // El mismo control de sonido gobierna música y SFX; antes el mute sólo
    // silenciaba los avisos y dejaba el drone de fondo encendido.
    setHumoBedLevel(phase === 'play' && !muted)
  }, [muted, phase])

  const finish = useCallback(async () => {
    const prevBest = loadPersonalBest()
    const localSim = simulateRun(seedRef.current, strokesRef.current)
    const arrived = localSim.savedByIncident.filter((row) => row.arrived).length
    savePersonalBest(localSim.hectares)
    saveDayBest(localSim.hectares)
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
      headline: localSim.headline,
      dayBest: Math.max(loadDayBest(), localSim.hectares),
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
          headline?: string
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
          headline: data.headline ?? localSim.headline,
          dayBest: Math.max(loadDayBest(), data.hectares ?? localSim.hectares),
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
    const focusPx = worldToPx(layout, normOfCell(inc.focus))
    snapAtRef.current = performance.now()
    shocksRef.current = [...shocksRef.current, { x: focusPx.x, y: focusPx.y, born: performance.now(), color: preview.arrived ? '#19C37D' : '#FF5A36' }].slice(-6)
    if (preview.arrived && preview.saved > 0) {
      resolvedRef.current.add(inc.id)
      playHumoCue('save')
      tap(10, reducedRef.current)
      shakeRef.current = 1.35
      flashRef.current = 0.9
      flashTintRef.current = 'save'
      pushJuice(preview.late ? humoCopy.juice.ARRIVE : humoCopy.juice.SAVE, preview.late ? '#FF9F1C' : '#19C37D', 1.05)
      savedRef.current = [
        ...savedRef.current,
        ...preview.cells.map((cell, i) => ({ ...cell, born: performance.now(), delay: i * 18 })),
      ]
      floatersRef.current.push({ text: humoCopy.plusHa(preview.saved), x: focusPx.x, y: focusPx.y, born: performance.now(), color: '#19C37D' })
      const kind = inc.kind === 'water' ? 'water' : 'dust'
      particlesRef.current.push(...spawnBurst(focusPx.x, focusPx.y, inc.kind === 'water' ? '#6aa0aa' : '#19C37D', 18, 0.95, kind))
      runnerRef.current = { points: guidePath(world, inc).map(normOfCell), born: performance.now() }
    } else {
      playHumoCue('miss')
      tap(18, reducedRef.current)
      shakeRef.current = 1.1
      flashRef.current = 0.75
      flashTintRef.current = 'miss'
      pushJuice(humoCopy.juice.MISS, '#FF5A36', 1.05)
      particlesRef.current.push(...spawnBurst(focusPx.x, focusPx.y, '#FF5A36', 14, 0.85, 'ember'))
    }
  }, [])

  const beginPlay = useCallback(() => {
    if (phaseRef.current !== 'ready') return
    void unlockHumoAudio()
    setHumoBedLevel(true)
    tRef.current = 0
    accRef.current = 0
    lastRef.current = performance.now()
    resetFx()
    worldRef.current = createWorld(seedRef.current)
    setHud({
      left: MATCH_MS,
      ha: 0,
      ghost: 0,
      canAct: false,
      clutch: false,
      line: humoCopy.hint,
      focusIndex: 0,
      focusLabel: '',
      focusLeft: 0,
      focusBudget: 1,
    })
    setPhaseBoth('play')
  }, [])

  useEffect(() => {
    if (!shot || phase !== 'ready' || shotOnceRef.current) return
    const world = worldRef.current
    if (!world) return
    shotOnceRef.current = true
    if (shot === 'ready' || shot === 'attract') return
    const path = firstGuidePath(world).map(normOfCell)
    const inc0 = world.incidents[0]!
    if (shot === 'action') {
      beginPlay()
      freezeRef.current = true
      tRef.current = 5_200
      drawingRef.current = {
        incident: 0,
        points: path.slice(0, Math.max(2, Math.floor(path.length * 0.7))),
        t0: 4_200,
        t1: 5_200,
      }
      etaRef.current = previewEta(world, inc0, drawingRef.current.points, 5_200)
      ghostRef.current = resolveIncident(world, inc0, { ...drawingRef.current, points: [...drawingRef.current.points, normOfCell(inc0.focus)] }).cells
      setHud({
        left: MATCH_MS - 5_200,
        ha: 0,
        ghost: ghostRef.current.length,
        canAct: true,
        clutch: false,
        line: humoCopy.draw,
        focusIndex: 1,
        focusLabel: 'CASA',
        focusLeft: 6_840,
        focusBudget: 12_040,
      })
      return
    }
    if (shot === 'save') {
      beginPlay()
      freezeRef.current = true
      tRef.current = 7_000
      commitStroke({ incident: 0, points: path, t0: 4_200, t1: 6_800 })
      setHud({
        left: MATCH_MS - 7_000,
        ha: hectaresRef.current,
        ghost: 0,
        canAct: false,
        clutch: false,
        line: humoCopy.juice.SAVE,
        focusIndex: 0,
        focusLabel: '',
        focusLeft: 0,
        focusBudget: 1,
      })
      return
    }
    if (shot === 'miss') {
      beginPlay()
      freezeRef.current = true
      tRef.current = 14_200
      missedRef.current.add(0)
      flashRef.current = 0.85
      flashTintRef.current = 'miss'
      shakeRef.current = 1.1
      pushJuice(humoCopy.juice.MISS, '#FF5A36', 1.05)
      return
    }
    if (shot === 'end-win') {
      beginPlay()
      strokesRef.current = optimalStrokes(seedRef.current)
      hectaresRef.current = simulateRun(seedRef.current, strokesRef.current).hectares
      setPhaseBoth('end')
      void finish()
      return
    }
    if (shot === 'end-miss') {
      beginPlay()
      setPhaseBoth('end')
      void finish()
    }
  }, [beginPlay, commitStroke, finish, phase, shot])

  useEffect(() => {
    if (!rec || phase !== 'ready' || recOnceRef.current) return
    recOnceRef.current = true
    const canvas = canvasRef.current
    if (!canvas) return
    const seconds = rec === 'loop' ? 14 : 12
    const chunks: Blob[] = []
    let recorder: MediaRecorder | null = null
    let stopped = false
    try {
      const stream = canvas.captureStream(30)
      try {
        recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' })
      } catch {
        recorder = new MediaRecorder(stream, { mimeType: 'video/webm' })
      }
    } catch {
      return
    }
    recorder.ondataavailable = (event) => {
      if (event.data.size) chunks.push(event.data)
    }
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' })
      void blob.arrayBuffer().then((buf) =>
        fetch('/api/humo/capture', {
          method: 'POST',
          headers: { 'x-filename': `humo-${rec}.webm` },
          body: buf,
        }),
      )
    }
    recorder.start(250)
    beginPlay()
    const stopId = window.setTimeout(() => {
      if (!stopped) recorder?.stop()
    }, seconds * 1000)
    return () => {
      stopped = true
      window.clearTimeout(stopId)
      try {
        recorder?.stop()
      } catch {
        /* already */
      }
    }
  }, [beginPlay, phase, rec])

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

  const finishDraw = useCallback((event?: React.PointerEvent<HTMLCanvasElement>) => {
    const drawing = drawingRef.current
    if (!drawing || phaseRef.current !== 'play') return
    drawing.t1 = tRef.current
    const world = worldRef.current
    const inc = world?.incidents[drawing.incident]
    const release = event ? eventToNorm(event) : null
    if (release) drawing.points = [drawing.points[0]!, release]
    const last = drawing.points[drawing.points.length - 1]
    if (!movedRef.current || drawing.points.length < 2 || !inc || !last || !world) {
      cancelDraw()
      return
    }
    if (tRef.current >= assetDeadlineMs(inc)) {
      cancelDraw()
      coach(humoCopy.coachLate)
      return
    }
    const end = snapEnd(world, inc, last)
    if (!end.ok) {
      cancelDraw()
      pushJuice(humoCopy.coach, '#FF9F1C', 0.95)
      coach(humoCopy.coachRelease)
      return
    }
    drawing.points = [drawing.points[0]!, end.snapped]
    commitStroke(drawing)
  }, [commitStroke])

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault()
    if (event.pointerType === 'mouse' && event.button !== 0) return
    if (phaseRef.current === 'ready') beginPlay()
    if (phaseRef.current !== 'play' || demo) return
    const world = worldRef.current
    if (!world) return
    const inc = incidentAt(tRef.current, world)
    if (!inc) return
    if (tRef.current >= assetDeadlineMs(inc)) {
      coach(humoCopy.coachLate)
      return
    }
    if (strokesRef.current.some((s) => s.incident === inc.id)) return
    const pt = eventToNorm(event)
    if (!pt) return
    const start = snapStart(world, pt)
    if (!start.ok) {
      pushJuice(humoCopy.coach, '#19C37D', 0.9)
      coach(humoCopy.coach)
      return
    }
    // Un segundo intento válido tiene prioridad: no dejamos que el aviso de
    // error anterior diga "empezá" mientras el jugador ya está rescatando.
    coachRef.current = ''
    coachUntilRef.current = 0
    juiceRef.current = juiceRef.current.filter((row) => row.label !== humoCopy.coach)
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      /* overlay */
    }
    movedRef.current = false
    downPtRef.current = pt
    dragDistRef.current = 0
    grabAtRef.current = performance.now()
    playHumoCue('grab')
    tap(12, reducedRef.current)
    const nodePx = worldToPx(layoutRef.current, start.snapped)
    shocksRef.current = [...shocksRef.current, { x: nodePx.x, y: nodePx.y, born: performance.now(), color: '#19C37D' }].slice(-6)
    drawingRef.current = { incident: inc.id, points: [start.snapped, start.snapped], t0: tRef.current, t1: tRef.current }
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
    const last = drawing.points[1] ?? drawing.points[0]
    if (last) {
      const step = Math.hypot(pt.x - last.x, pt.y - last.y)
      if (step < 0.00012) return
      // El recorrido se ve como un lazo claro base → dedo. No acumulamos
      // garabatos ni dejamos de registrar el final al llegar a un límite.
      drawing.points = [drawing.points[0]!, pt]
      dragDistRef.current += step
      if (dragDistRef.current >= 0.045) {
        dragDistRef.current = 0
        playHumoCue('tick')
      }
    }
    drawing.t1 = tRef.current
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
      if (w < 1 || h < 1) {
        raf = window.requestAnimationFrame(loop)
        return
      }
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
        canvas.width = Math.floor(w * dpr)
        canvas.height = Math.floor(h * dpr)
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      layoutRef.current = gridLayout(w, h)
      let clutch = false
      const world = worldRef.current

      shakeRef.current *= 0.86
      flashRef.current *= 0.88
      if (shakeRef.current < 0.04) shakeRef.current = 0
      if (flashRef.current < 0.03) flashRef.current = 0
      haShownRef.current += (hectaresRef.current - haShownRef.current) * 0.18

      if (phaseRef.current === 'play' && world) {
        if (!freezeRef.current) {
        if (!lastRef.current) lastRef.current = now
        accRef.current += now - lastRef.current
        lastRef.current = now
        while (accRef.current >= TICK_MS && tRef.current < MATCH_MS) {
          accRef.current -= TICK_MS
          tRef.current += TICK_MS
        }
        const t = tRef.current
        const inc = incidentAt(t, world)
        clutch = isClutch(t, inc)

        if (inc && !announcedRef.current.has(inc.id)) {
          announcedRef.current.add(inc.id)
          playHumoCue('fire')
          const fx = worldToPx(layoutRef.current, normOfCell(inc.focus))
          particlesRef.current.push(...spawnBurst(fx.x, fx.y, '#FF5A36', 14, 1.05, 'ember'))
        }
        if (inc && clutch && !clutchRef.current.has(inc.id) && !strokesRef.current.some((s) => s.incident === inc.id)) {
          clutchRef.current.add(inc.id)
          playHumoCue('clutch')
          pushJuice(humoCopy.juice.CLUTCH, '#FF5A36', 1.08)
        }
        for (const row of world.incidents) {
          if (t >= row.commitMs && !strokesRef.current.some((s) => s.incident === row.id) && !missedRef.current.has(row.id)) {
            missedRef.current.add(row.id)
            if (drawingRef.current?.incident === row.id) drawingRef.current = null
            playHumoCue('late')
            shakeRef.current = Math.max(shakeRef.current, 0.9)
            flashRef.current = 0.7
            flashTintRef.current = 'miss'
            pushJuice(humoCopy.juice.MISS, '#FF5A36', 1.05)
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
        if (!reducedRef.current && now % 4 < 1.6) {
          particlesRef.current.push(...spawnWind(layoutRef.current, world, now))
        }
        if (demo && inc && !strokesRef.current.some((s) => s.incident === inc.id) && !isTelegraph(t)) {
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
          const canAct = Boolean(inc && t < assetDeadlineMs(inc) && !isTelegraph(t) && !strokesRef.current.some((s) => s.incident === inc.id))
          const next = world.incidents.find((row) => t < row.appearMs)
          const focusBudget = inc ? Math.max(1, assetDeadlineMs(inc) - inc.appearMs) : 1
          const focusLeft = inc ? Math.max(0, assetDeadlineMs(inc) - t) : 0
          const focusLabel = inc?.kind === 'house' ? 'CASA' : inc?.kind === 'water' ? 'ESTANQUE' : inc ? 'CORRAL' : ''
          const fallbackLine = next
            ? `PRÓXIMO FOCO EN ${Math.max(1, Math.ceil((next.appearMs - t) / 1000))} S`
            : inc
              ? humoCopy.coachLate
              : 'RUTA ENVIADA · MIRÁ EL PRÓXIMO FOCO'
          setHud({
            left: Math.max(0, MATCH_MS - t),
            ha: Math.round(haShownRef.current),
            ghost: drawingRef.current ? hud.ghost : 0,
            canAct,
            clutch,
            focusIndex: canAct && inc ? inc.id + 1 : 0,
            focusLabel: canAct ? focusLabel : '',
            focusLeft: canAct ? focusLeft : 0,
            focusBudget,
            line:
              performance.now() < coachUntilRef.current
                ? coachRef.current
                : drawingRef.current
                  ? humoCopy.draw
                  : clutch
                    ? 'ÚLTIMO FOCO · SOLTÁ EN EL ARO'
                    : canAct
                      ? humoCopy.hint
                      : fallbackLine,
          })
        }
        }
      } else {
        lastRef.current = now
      }

      particlesRef.current = stepParticles(particlesRef.current).slice(-160)
      juiceRef.current = juiceRef.current.filter((j) => now - j.born < 900)
      floatersRef.current = floatersRef.current.filter((f) => now - f.born < 1100)
      shocksRef.current = shocksRef.current.filter((s) => now - s.born < 320)

      const liveWorld = worldRef.current
      const liveInc = liveWorld ? incidentAt(tRef.current, liveWorld) : null
      const canAct = Boolean(liveInc && tRef.current < assetDeadlineMs(liveInc) && !isTelegraph(tRef.current) && !strokesRef.current.some((s) => s.incident === liveInc.id))
      const guide =
        liveWorld && liveInc && canAct && !drawingRef.current && !strokesRef.current.some((s) => s.incident === liveInc.id)
          ? [normOfCell(liveWorld.node), normOfCell(liveInc.focus)]
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
        onRoad: true,
        clutch,
        hint: canAct && Boolean(liveInc && liveInc.id === 0),
        canAct,
        guide,
        runner: runnerRef.current,
        eta: etaRef.current,
        reduced: reducedRef.current,
        grabAt: grabAtRef.current,
        snapAt: snapAtRef.current,
        haShown: haShownRef.current,
        cleared: resolvedRef.current,
      })
      raf = window.requestAnimationFrame(loop)
    }
    raf = window.requestAnimationFrame(loop)
    return () => {
      alive = false
      window.cancelAnimationFrame(raf)
    }
  }, [commitStroke, demo, finish, hud.ghost, startRun])

  useEffect(() => {
    if (!demo || phase !== 'ready') return
    const id = window.setTimeout(() => beginPlay(), 1200)
    return () => window.clearTimeout(id)
  }, [beginPlay, demo, phase])

  useDemoRematch(demo, phase, () => {
    bumpRematch()
    void startRun()
  })

  const rematch = () => {
    bumpRematch()
    void startRun().then(() => beginPlay())
  }

  const seconds = Math.ceil(hud.left / 1000)

  return (
    <div className="relative h-full min-h-0 bg-[#0D1210]">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none"
        style={{ touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishDraw}
        onPointerCancel={cancelDraw}
        aria-label="Predio. Arrastrá desde la base verde hasta el fuego."
      />

      <header className="pointer-events-none absolute inset-x-0 top-[max(0.35rem,env(safe-area-inset-top))] z-20 flex items-start justify-between px-3">
        <div className="flex items-start gap-2">
          <Link
            href="/lab"
            aria-label="Volver a Sala Aura"
            className="pointer-events-auto flex h-12 items-center gap-1 rounded-full border border-[#F4E7CF]/70 bg-[#0D1210]/70 px-3 font-display text-sm text-[#F4E7CF] backdrop-blur-sm"
          >
            <span aria-hidden>←</span> SALA
          </Link>
          <div className="rounded-2xl bg-[#F4E7CF] px-3 py-1.5 text-[#0D1210] shadow-[0_8px_24px_rgba(0,0,0,0.28)]">
            <p className="font-display text-[2.1rem] leading-none tabular-nums">{seconds}</p>
            <p className="text-xs font-semibold tracking-wide text-[#8B5E34]">{hud.ha} ha</p>
          </div>
        </div>
        <button
          type="button"
          aria-label={muted ? humoCopy.mute : humoCopy.sound}
          className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#F4E7CF]/80 bg-[#0D1210]/55 text-[#F4E7CF]"
          onClick={() => setPulsoMuted(!muted)}
        >
          {muted ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M4 10v4h3l5 4V6L7 10H4z" fill="currentColor" />
              <path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" strokeWidth="2" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M4 10v4h3l5 4V6L7 10H4z" fill="currentColor" />
              <path d="M16 8.5a4.5 4.5 0 010 7M18.5 6a8 8 0 010 12" stroke="currentColor" strokeWidth="2" />
            </svg>
          )}
        </button>
      </header>

      {phase === 'play' && hud.focusIndex > 0 ? (
        <div className="pointer-events-none absolute left-1/2 top-[max(0.65rem,env(safe-area-inset-top))] z-20 w-[10.5rem] -translate-x-1/2 rounded-full border border-[#F4E7CF]/25 bg-[#0D1210]/78 px-3 py-1.5 text-center backdrop-blur-sm">
          <p className="font-[family-name:var(--hud-font)] text-[9px] tracking-[0.18em] text-[#F4E7CF]">{humoCopy.focus(hud.focusIndex, hud.focusLabel)}</p>
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-[#FF9F1C] transition-[width] duration-100"
              style={{ width: `${Math.min(100, (hud.focusLeft / hud.focusBudget) * 100)}%` }}
            />
          </div>
        </div>
      ) : null}

      {phase !== 'end' ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-[#0D1210]/75 via-[#0D1210]/20 to-transparent px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-10">
          <p className="text-center font-display text-2xl text-[#F4E7CF] drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
            {phase === 'play' ? hud.line : phase === 'ready' ? humoCopy.hint : phase === 'boot' ? 'Cargando predio' : ''}
          </p>
          {phase === 'ready' ? (
            <div className="pointer-events-auto mt-3 flex items-end justify-between gap-3">
              <img
                src="/qr-arcade.png"
                alt={humoCopy.standQr}
                width={72}
                height={72}
                className={demo ? 'hidden' : 'hidden rounded-md bg-[#F4E7CF] p-1 md:block'}
              />
              <button
                type="button"
                onClick={beginPlay}
                className="min-h-14 flex-1 rounded-full bg-[#19C37D] px-6 font-display text-2xl tracking-wide text-[#0D1210] shadow-[0_10px_24px_rgba(25,195,125,0.28)]"
              >
                {humoCopy.cta}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

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
          headline={result.headline}
          dayBest={result.dayBest}
          seed={seedRef.current}
          initialAlias=""
          runToken={runToken}
          toBeat={toBeat}
          offline={offline || result.rank == null}
          onRematch={rematch}
        />
      )}
    </div>
  )
}
