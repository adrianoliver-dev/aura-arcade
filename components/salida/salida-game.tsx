'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { ArcadeBoot } from '@/components/arcade/arcade-boot'
import { ArcadeEnd } from '@/components/arcade/arcade-end'
import { ArcadeHud } from '@/components/arcade/arcade-hud'
import { ArcadeReady } from '@/components/arcade/arcade-ready'
import { playHumoSave, playPulsoSfx, unlockPulsoAudio } from '@/components/pulso/pulso-audio'
import { loadGameBest, saveGameBest } from '@/lib/arcade/liga'
import { useDemoRematch } from '@/lib/arcade/use-demo-rematch'
import { loadIdentity } from '@/lib/pulso/camba'
import type { BoardEntry } from '@/lib/pulso/types'
import {
  LANES,
  MATCH_MS,
  applyEvent,
  buildTrack,
  emptyScore,
  salidaTitle,
  simulateRun,
  type LaneEvent,
  type LaneMark,
  type LiveScore,
} from '@/lib/salida/sim'

type Phase = 'boot' | 'ready' | 'play' | 'end'

export function SalidaGame({ demo = false }: { demo?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const tRef = useRef(0)
  const seedRef = useRef(1)
  const tokenRef = useRef<string | null>(null)
  const laneRef = useRef(1)
  const marksRef = useRef<LaneMark[]>([{ t: 0, lane: 1 }])
  const trackRef = useRef<LaneEvent[]>([])
  const hitRef = useRef(new Set<number>())
  const scoreRef = useRef<LiveScore>(emptyScore())
  const lastRef = useRef(0)
  const endedRef = useRef(false)
  const shakeRef = useRef(0)
  const flashRef = useRef<'ok' | 'bad' | null>(null)
  const [phase, setPhase] = useState<Phase>('boot')
  const [identity, setIdentity] = useState({ alias: '', tag: 'SCZ' })
  const [hud, setHud] = useState({ left: MATCH_MS, score: 0, rescued: 0, combo: 0, lane: 1, hits: 0 })
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
    laneRef.current = 1
    marksRef.current = [{ t: 0, lane: 1 }]
    hitRef.current = new Set()
    scoreRef.current = emptyScore()
    endedRef.current = false
    shakeRef.current = 0
    const id = loadIdentity(String(seedRef.current))
    setIdentity(id)
    if (demo) {
      seedRef.current = (Date.now() ^ 0x33) >>> 0 || 1
      tokenRef.current = null
      trackRef.current = buildTrack(seedRef.current)
      setHud({ left: MATCH_MS, score: 0, rescued: 0, combo: 0, lane: 1, hits: 0 })
      setPhase('ready')
      return
    }
    try {
      const res = await fetch('/api/salida/run/start', { method: 'POST' })
      if (!res.ok) throw new Error('start')
      const data = (await res.json()) as { seed: number; token: string }
      seedRef.current = data.seed
      tokenRef.current = data.token
      setIdentity(loadIdentity(data.token))
    } catch {
      seedRef.current = (Date.now() ^ 0x33) >>> 0 || 1
      tokenRef.current = null
      setIdentity(loadIdentity(String(seedRef.current)))
    }
    trackRef.current = buildTrack(seedRef.current)
    setHud({ left: MATCH_MS, score: 0, rescued: 0, combo: 0, lane: 1, hits: 0 })
    setPhase('ready')
  }, [demo])

  useEffect(() => {
    void startRun()
  }, [startRun])

  const finish = useCallback(async () => {
    if (endedRef.current) return
    endedRef.current = true
    const local = simulateRun(seedRef.current, marksRef.current)
    const prize = salidaTitle(local.score, local.rescued, local.hits)
    const prevBest = loadGameBest('salida')
    saveGameBest('salida', local.score)
    const base = {
      score: local.score,
      subtitle: `${local.rescued} sacados · ${local.hits} golpes`,
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
      const res = await fetch('/api/salida/run/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: tokenRef.current,
          marks: marksRef.current,
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

  const setLane = useCallback(
    (lane: number) => {
      if (phase !== 'play' || endedRef.current) return
      const next = Math.max(0, Math.min(LANES - 1, lane))
      if (next === laneRef.current) return
      laneRef.current = next
      marksRef.current.push({ t: tRef.current, lane: next })
      setHud((h) => ({ ...h, lane: next }))
    },
    [phase],
  )

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
      if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A' || event.key === '1') setLane(laneRef.current - 1)
      if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D' || event.key === '3') setLane(laneRef.current + 1)
      if (event.key === '2') setLane(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, setLane])

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
      if (phase === 'play' && !endedRef.current) {
        if (!lastRef.current) lastRef.current = now
        tRef.current = Math.min(MATCH_MS, tRef.current + (now - lastRef.current))
        lastRef.current = now
        const t = tRef.current
        if (demo) {
          const next = trackRef.current.find((ev) => ev.t > t && ev.t < t + 720)
          if (next) {
            let want = laneRef.current
            if (next.kind === 'gente') want = next.lane
            else if (next.lane === laneRef.current) want = next.lane === 1 ? 0 : 1
            if (want !== laneRef.current) {
              laneRef.current = want
              marksRef.current.push({ t, lane: want })
            }
          }
        }
        trackRef.current.forEach((ev, i) => {
          if (hitRef.current.has(i) || t < ev.t) return
          hitRef.current.add(i)
          const kind = applyEvent(ev, laneRef.current, scoreRef.current)
          if (kind === 'save') {
            playHumoSave(12)
            flashRef.current = 'ok'
            try {
              navigator.vibrate?.(12)
            } catch {
              /* */
            }
          } else if (kind === 'hit') {
            playPulsoSfx('miss')
            shakeRef.current = 14
            flashRef.current = 'bad'
            try {
              navigator.vibrate?.(36)
            } catch {
              /* */
            }
          }
        })
        shakeRef.current *= 0.82
        setHud({
          left: MATCH_MS - t,
          score: scoreRef.current.score,
          rescued: scoreRef.current.rescued,
          combo: scoreRef.current.combo,
          lane: laneRef.current,
          hits: scoreRef.current.hits,
        })
        if (t >= MATCH_MS) void finish()
      } else {
        lastRef.current = now
      }

      const shake = shakeRef.current
      ctx.save()
      if (shake > 0.4) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake)
      ctx.fillStyle = '#07080C'
      ctx.fillRect(0, 0, w, h)
      const t = tRef.current
      const laneW = w / 3
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i === laneRef.current ? '#1a2a18' : '#10140F'
        ctx.fillRect(i * laneW, 0, laneW - 2, h)
        ctx.fillStyle = 'rgba(255,255,255,0.04)'
        for (let y = ((t / 8) % 46) - 46; y < h; y += 46) {
          ctx.fillRect(i * laneW + laneW / 2 - 2, y, 4, 22)
        }
      }
      const horizon = h * 0.16
      ctx.fillStyle = 'rgba(227,75,52,0.42)'
      ctx.fillRect(0, 0, w, horizon)
      for (const ev of trackRef.current) {
        const dt = ev.t - t
        if (dt < -200 || dt > 2800) continue
        const u = 1 - (dt + 200) / 3000
        const scale = 0.45 + u * 0.7
        const y = horizon + u * (h - horizon)
        const x = ev.lane * laneW + laneW / 2
        ctx.beginPath()
        ctx.fillStyle = ev.kind === 'gente' ? '#7DDC68' : ev.kind === 'fuego' ? '#FF6A1A' : '#6B4F3A'
        ctx.arc(x, y, (ev.kind === 'gente' ? 13 : 17) * scale, 0, Math.PI * 2)
        ctx.fill()
      }
      const px = laneRef.current * laneW + laneW / 2
      ctx.fillStyle = '#E8FFD2'
      ctx.beginPath()
      ctx.arc(px, h * 0.82, 16, 0, Math.PI * 2)
      ctx.fill()
      if (flashRef.current) {
        ctx.fillStyle = flashRef.current === 'ok' ? 'rgba(22,181,125,0.18)' : 'rgba(227,75,52,0.22)'
        ctx.fillRect(0, 0, w, h)
        flashRef.current = null
      }
      ctx.restore()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      alive = false
      cancelAnimationFrame(raf)
    }
  }, [demo, finish, phase])

  useEffect(() => {
    if (!demo || phase !== 'ready') return
    const id = window.setTimeout(() => {
      void unlockPulsoAudio()
      tRef.current = 0
      lastRef.current = performance.now()
      setPhase('play')
    }, 800)
    return () => window.clearTimeout(id)
  }, [demo, phase])

  useDemoRematch(demo, phase, () => {
    void startRun()
  })

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
            setPhase('play')
            return
          }
          const rect = e.currentTarget.getBoundingClientRect()
          const x = e.clientX - rect.left
          setLane(Math.floor((x / rect.width) * 3))
        }}
      />
      {phase === 'boot' ? <ArcadeBoot label="Abriendo sendas" /> : null}
      {phase === 'ready' ? (
        <ArcadeReady
          kicker="SALIDA"
          title="Tres caminos"
          body="Tocá un carril. Evitá el fuego. Agarrá a la gente. Tankear no da título."
          cue="TOCÁ · ← →"
          accent="#7DDC68"
          onStart={() => {
            void unlockPulsoAudio()
            tRef.current = 0
            lastRef.current = performance.now()
            setPhase('play')
          }}
        />
      ) : null}
      {phase === 'play' ? (
        <ArcadeHud
          score={hud.score}
          timeMs={hud.left}
          accent="#7DDC68"
          clutch={hud.hits > 4}
          left={
            <>
              {hud.combo > 1 ? <p className="text-sm font-black text-[#C4B5FD]">x{hud.combo}</p> : null}
              <p className="text-[11px] text-[#7DDC68]">{hud.rescued} sacados</p>
            </>
          }
          right={<p className="mt-1 text-[11px] text-white/55">{hud.hits} golpes</p>}
        />
      ) : null}
      {phase === 'end' && result ? (
        <ArcadeEnd
          game="SALIDA"
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
          finishPath="/api/salida/run/finish"
          onRematch={() => void startRun()}
        />
      ) : null}
    </div>
  )
}
