'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { ArcadeEnd } from '@/components/arcade/arcade-end'
import { playHumoClutch, playHumoWhoosh, playPulsoSfx, unlockPulsoAudio } from '@/components/pulso/pulso-audio'
import { loadGameBest, saveGameBest } from '@/lib/arcade/liga'
import {
  COLS,
  MATCH_MS,
  ROWS,
  SPREAD_MS,
  createMuroLive,
  houseCell,
  keyOf,
  muroTitle,
  simulateRun,
  tickMuro,
  type MuroLive,
  type WallMark,
} from '@/lib/muro/sim'
import { loadIdentity } from '@/lib/pulso/camba'
import type { BoardEntry } from '@/lib/pulso/types'

type Phase = 'boot' | 'ready' | 'play' | 'end'
type Spark = { x: number; y: number; vx: number; vy: number; life: number; color: string }

export function MuroGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const tRef = useRef(0)
  const seedRef = useRef(1)
  const tokenRef = useRef<string | null>(null)
  const wallsRef = useRef<WallMark[]>([])
  const liveRef = useRef<MuroLive>(createMuroLive(1))
  const lastSpread = useRef(0)
  const lastRef = useRef(0)
  const painting = useRef(false)
  const endedRef = useRef(false)
  const clutchPlayed = useRef(false)
  const sparksRef = useRef<Spark[]>([])
  const [phase, setPhase] = useState<Phase>('boot')
  const [identity, setIdentity] = useState({ alias: '', tag: 'SCZ' })
  const [hud, setHud] = useState({ left: MATCH_MS, walls: 0, houseUp: true, threat: 12 })
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
    wallsRef.current = []
    sparksRef.current = []
    endedRef.current = false
    clutchPlayed.current = false
    const id = loadIdentity(String(seedRef.current))
    setIdentity(id)
    try {
      const res = await fetch('/api/muro/run/start', { method: 'POST' })
      if (!res.ok) throw new Error('start')
      const data = (await res.json()) as { seed: number; token: string }
      seedRef.current = data.seed
      tokenRef.current = data.token
      setIdentity(loadIdentity(data.token))
    } catch {
      seedRef.current = (Date.now() ^ 0x22) >>> 0 || 1
      tokenRef.current = null
      setIdentity(loadIdentity(String(seedRef.current)))
    }
    liveRef.current = createMuroLive(seedRef.current)
    lastSpread.current = 0
    setHud({ left: MATCH_MS, walls: 0, houseUp: true, threat: 12 })
    setPhase('ready')
  }, [])

  useEffect(() => {
    void startRun()
  }, [startRun])

  const finish = useCallback(async () => {
    if (endedRef.current) return
    endedRef.current = true
    const local = simulateRun(seedRef.current, wallsRef.current)
    const prize = muroTitle(local.score, local.houseUp)
    const prevBest = loadGameBest('muro')
    saveGameBest('muro', local.score)
    const base = {
      score: local.score,
      subtitle: local.houseUp ? 'La casa sigue' : 'El fuego llegó',
      title: prize.title,
      rank: null as number | null,
      total: 0,
      gap: 0,
      today: [] as BoardEntry[],
      personalBest: prevBest,
    }
    setResult(base)
    setPhase('end')
    if (!tokenRef.current) return
    try {
      const res = await fetch('/api/muro/run/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: tokenRef.current,
          walls: wallsRef.current,
          alias: identity.alias,
          tag: identity.tag,
        }),
      })
      if (!res.ok) return
      const data = (await res.json()) as { score: number; rank: number; total: number; gap: number; today: BoardEntry[] }
      setResult({ ...base, score: data.score, rank: data.rank, total: data.total, gap: data.gap, today: data.today ?? [] })
    } catch {
      /* */
    }
  }, [identity.alias, identity.tag])

  const paintAt = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || phase !== 'play' || endedRef.current) return
    const rect = canvas.getBoundingClientRect()
    const c = Math.max(0, Math.min(COLS - 1, Math.floor(((event.clientX - rect.left) / rect.width) * COLS)))
    const r = Math.max(0, Math.min(ROWS - 1, Math.floor(((event.clientY - rect.top) / rect.height) * ROWS)))
    const k = keyOf(c, r)
    if (liveRef.current.fire.has(k)) return
    const house = houseCell(seedRef.current)
    if (c === house.c && r === house.r) return
    if (wallsRef.current.some((w) => w.c === c && w.r === r)) return
    wallsRef.current.push({ c, r, t: tRef.current })
    playHumoWhoosh()
    try {
      navigator.vibrate?.(10)
    } catch {
      /* */
    }
    const cellW = rect.width / COLS
    const cellH = rect.height / ROWS
    for (let i = 0; i < 5; i++) {
      sparksRef.current.push({
        x: (c + 0.5) * cellW,
        y: (r + 0.5) * cellH,
        vx: (Math.random() - 0.5) * 80,
        vy: (Math.random() - 0.5) * 80,
        life: 1,
        color: '#C4B5FD',
      })
    }
    setHud((h) => ({ ...h, walls: wallsRef.current.length }))
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
      const cellW = w / COLS
      const cellH = h / ROWS
      let threat = 12
      if (phase === 'play' && !endedRef.current) {
        if (!lastRef.current) lastRef.current = now
        tRef.current = Math.min(MATCH_MS, tRef.current + (now - lastRef.current))
        lastRef.current = now
        while (tRef.current - lastSpread.current >= SPREAD_MS && !endedRef.current) {
          lastSpread.current += SPREAD_MS
          const before = liveRef.current.burned
          liveRef.current = tickMuro(liveRef.current, seedRef.current, wallsRef.current, lastSpread.current)
          if (liveRef.current.burned > before) {
            sparksRef.current.push({
              x: Math.random() * w,
              y: Math.random() * h * 0.4,
              vx: (Math.random() - 0.5) * 40,
              vy: -20 - Math.random() * 40,
              life: 1,
              color: '#FF6A1A',
            })
          }
          if (!liveRef.current.houseUp) {
            playPulsoSfx('brecha')
            void finish()
          }
        }
        const houseNow = houseCell(seedRef.current)
        threat = 99
        for (const k of liveRef.current.fire) {
          const [cs, rs] = k.split(',')
          threat = Math.min(threat, Math.abs(Number(cs) - houseNow.c) + Math.abs(Number(rs) - houseNow.r))
        }
        if (threat <= 3 && !clutchPlayed.current) {
          clutchPlayed.current = true
          playHumoClutch()
        }
        if (tRef.current >= MATCH_MS) void finish()
        setHud({
          left: MATCH_MS - tRef.current,
          walls: wallsRef.current.length,
          houseUp: liveRef.current.houseUp,
          threat,
        })
      } else {
        lastRef.current = now
      }

      const threatPulse = threat <= 3 && phase === 'play'
      ctx.fillStyle = threatPulse ? '#1a0808' : '#0A0A0F'
      ctx.fillRect(0, 0, w, h)
      const house = houseCell(seedRef.current)
      const wall = new Set(wallsRef.current.filter((x) => x.t <= tRef.current).map((x) => keyOf(x.c, x.r)))
      const fire = liveRef.current.fire
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const x = c * cellW
          const y = r * cellH
          const k = keyOf(c, r)
          if (fire.has(k)) {
            ctx.fillStyle = (c + r + Math.floor(now / 90)) % 2 ? '#E34B34' : '#FF6A1A'
          } else if (wall.has(k)) ctx.fillStyle = '#C4B5FD'
          else if (c === house.c && r === house.r) ctx.fillStyle = liveRef.current.houseUp ? '#E8DCC8' : '#5a2018'
          else ctx.fillStyle = (c + r) % 2 ? '#142016' : '#10180F'
          ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2)
        }
      }
      ctx.font = `bold ${Math.floor(cellH * 0.7)}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#0A0A0F'
      ctx.fillText('⌂', (house.c + 0.5) * cellW, (house.r + 0.5) * cellH)

      const dt = 0.016
      sparksRef.current = sparksRef.current.filter((s) => s.life > 0)
      for (const s of sparksRef.current) {
        s.x += s.vx * dt
        s.y += s.vy * dt
        s.life -= dt * 1.6
        ctx.globalAlpha = Math.max(0, s.life)
        ctx.fillStyle = s.color
        ctx.fillRect(s.x, s.y, 3, 3)
      }
      ctx.globalAlpha = 1
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      alive = false
      cancelAnimationFrame(raf)
    }
  }, [finish, phase])

  return (
    <div className="relative h-full w-full">
      <canvas
        ref={canvasRef}
        className="block h-full w-full touch-none"
        onPointerDown={(e) => {
          void unlockPulsoAudio()
          if (phase === 'ready') {
            tRef.current = 0
            lastRef.current = performance.now()
            lastSpread.current = 0
            setPhase('play')
            return
          }
          painting.current = true
          try {
            e.currentTarget.setPointerCapture(e.pointerId)
          } catch {
            /* */
          }
          paintAt(e)
        }}
        onPointerMove={(e) => {
          if (painting.current) paintAt(e)
        }}
        onPointerUp={() => {
          painting.current = false
        }}
      />
      {phase === 'ready' ? (
        <div className="pointer-events-none absolute inset-x-0 top-[12%] text-center">
          <p className="text-[11px] tracking-[0.32em] text-[#C4B5FD]">MURO</p>
          <p className="mt-2 text-2xl font-black">Pintá la pared</p>
          <p className="mt-2 text-sm text-white/60">El fuego camina 90s. Encerralo. Protegé la casa.</p>
          <p className="mt-6 animate-pulse text-xs tracking-[0.2em] text-[#F2A021]">ARRASTRÁ</p>
        </div>
      ) : null}
      {phase === 'play' ? (
        <div className="pointer-events-none absolute inset-x-0 top-16 flex justify-between px-4">
          <p className="text-xl font-black text-[#C4B5FD]">{hud.walls} muros</p>
          <p className={`text-2xl font-black ${hud.threat <= 3 ? 'text-[#E34B34]' : ''}`}>{Math.ceil(hud.left / 1000)}s</p>
        </div>
      ) : null}
      {phase === 'end' && result ? (
        <ArcadeEnd
          game="MURO"
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
          finishPath="/api/muro/run/finish"
          onRematch={() => void startRun()}
        />
      ) : null}
    </div>
  )
}
