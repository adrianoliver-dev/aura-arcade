'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import { ARCADE_GAMES, type ArcadeGame } from '@/lib/arcade/games'

const SLIDE_MS = 12_000

function drawPulso(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  ctx.fillStyle = '#0A0A0F'
  ctx.fillRect(0, 0, w, h)
  const cx = w / 2
  const cy = h * 0.46
  for (let i = 0; i < 4; i++) {
    const u = (t / 900 + i * 0.25) % 1
    ctx.beginPath()
    ctx.strokeStyle = `rgba(242,160,33,${1 - u})`
    ctx.lineWidth = 6
    ctx.arc(cx, cy, 40 + u * 180, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.fillStyle = '#F2A021'
  ctx.beginPath()
  ctx.arc(cx, cy, 10, 0, Math.PI * 2)
  ctx.fill()
}

function drawHumo(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  ctx.fillStyle = '#0A0A0F'
  ctx.fillRect(0, 0, w, h)
  const cols = 14
  const rows = 18
  const cw = w / cols
  const ch = h / rows
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const burn = (t / 80 - r * 18 + c * 9) % 400
      ctx.fillStyle = burn < 90 ? '#E34B34' : (c + r) % 2 ? '#142016' : '#10180F'
      ctx.fillRect(c * cw, r * ch, cw - 1, ch - 1)
    }
  }
  ctx.strokeStyle = '#7DDC68'
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.moveTo(w * 0.12, h * 0.82)
  ctx.quadraticCurveTo(w * 0.4, h * 0.5, w * 0.72, h * 0.28 + Math.sin(t / 400) * 8)
  ctx.stroke()
}

function drawRadio(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  ctx.fillStyle = t % 1400 < 180 ? '#1a0808' : '#0A0A0F'
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = '#E34B34'
  ctx.fillRect(w * 0.12, h * 0.28, w * 0.76, h * 0.22)
  ctx.fillStyle = '#0A0A0F'
  ctx.font = `bold ${Math.floor(w * 0.07)}px sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText('¿AGUA O CORTE?', w / 2, h * 0.42)
  const labels = ['AGUA', 'CORTE', 'EVACUÁ']
  const colors = ['#3B82F6', '#F2A021', '#E34B34']
  const pick = Math.floor(t / 900) % 3
  labels.forEach((label, i) => {
    ctx.fillStyle = colors[i]!
    ctx.globalAlpha = i === pick ? 1 : 0.45
    ctx.fillRect(w * 0.1 + i * w * 0.28, h * 0.62, w * 0.24, h * 0.14)
    ctx.globalAlpha = 1
    ctx.fillStyle = '#0A0A0F'
    ctx.font = `bold ${Math.floor(w * 0.045)}px sans-serif`
    ctx.fillText(label, w * 0.22 + i * w * 0.28, h * 0.71)
  })
}

function drawMuro(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  ctx.fillStyle = '#0A0A0F'
  ctx.fillRect(0, 0, w, h)
  const cols = 12
  const rows = 16
  const cw = w / cols
  const ch = h / rows
  const fireR = 1 + Math.floor((t / 420) % 10)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const isWall = r === 8 && c >= 2 && c <= 9
      const isHouse = r === 13 && c === 6
      const isFire = r <= fireR && !isWall
      ctx.fillStyle = isFire ? '#FF6A1A' : isWall ? '#C4B5FD' : isHouse ? '#E8DCC8' : (c + r) % 2 ? '#142016' : '#10180F'
      ctx.fillRect(c * cw + 1, r * ch + 1, cw - 2, ch - 2)
    }
  }
}

function drawSalida(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  ctx.fillStyle = '#07080C'
  ctx.fillRect(0, 0, w, h)
  const lane = Math.floor(t / 700) % 3
  const laneW = w / 3
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i === lane ? '#1a2a18' : '#10140F'
    ctx.fillRect(i * laneW, 0, laneW - 2, h)
  }
  ctx.fillStyle = 'rgba(227,75,52,0.4)'
  ctx.fillRect(0, 0, w, h * 0.16)
  const y = ((t * 0.35) % (h + 40)) - 20
  ctx.fillStyle = '#FF6A1A'
  ctx.beginPath()
  ctx.arc(laneW * 0.5, y, 16, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#7DDC68'
  ctx.beginPath()
  ctx.arc(laneW * 2.5, (y + 180) % h, 14, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#E8FFD2'
  ctx.beginPath()
  ctx.arc(lane * laneW + laneW / 2, h * 0.8, 16, 0, Math.PI * 2)
  ctx.fill()
}

const DRAWS: Record<ArcadeGame['id'], typeof drawPulso> = {
  anillos: drawPulso,
  humo: drawHumo,
  radio: drawRadio,
  muro: drawMuro,
  salida: drawSalida,
}

export function AttractLoop() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [index, setIndex] = useState(0)
  const game = ARCADE_GAMES[index]!

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const n = Number(event.key)
      if (n >= 1 && n <= 5) setIndex(n - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % ARCADE_GAMES.length)
    }, SLIDE_MS)
    return () => window.clearInterval(id)
  }, [index])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let raf = 0
    let alive = true
    const t0 = performance.now()
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
      DRAWS[game.id](ctx, w, h, now - t0)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      alive = false
      cancelAnimationFrame(raf)
    }
  }, [game.id])

  return (
    <div className="relative h-full w-full">
      <canvas ref={canvasRef} className="block h-full w-full" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/40" />
      <div className="absolute inset-x-0 top-8 text-center">
        <p className="text-[11px] tracking-[0.32em] text-[#16B57D]">AURA ARCADE · FEXPOCRUZ</p>
        <p className="mt-3 text-4xl font-black" style={{ color: game.accent }}>
          {game.title}
        </p>
        <p className="mx-auto mt-3 max-w-sm px-6 text-lg font-semibold text-white">{game.promise}</p>
      </div>
      <div className="absolute inset-x-0 bottom-8 px-4">
        <div className="mb-4 flex justify-center gap-2">
          {ARCADE_GAMES.map((g, i) => (
            <button
              key={g.id}
              type="button"
              aria-label={g.title}
              className="h-2.5 rounded-full"
              style={{
                width: i === index ? 28 : 10,
                background: i === index ? g.accent : 'rgba(255,255,255,0.25)',
              }}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
        <Link
          href={game.href}
          className="mx-auto block max-w-sm rounded-xl py-4 text-center text-lg font-black text-[#0A0A0F]"
          style={{ background: game.accent }}
        >
          JUGÁ {game.title}
        </Link>
        <Link href="/" className="mt-3 block text-center text-[11px] tracking-[0.2em] text-white/50">
          SALA COMPLETA
        </Link>
      </div>
    </div>
  )
}
