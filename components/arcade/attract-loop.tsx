'use client'

import { useEffect, useRef, useState } from 'react'

import { humoCopy } from '@/lib/humo/copy'

const PULSO_MS = 12_000

function drawPulso(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  ctx.fillStyle = '#0D1210'
  ctx.fillRect(0, 0, w, h)
  const cx = w / 2
  const cy = h * 0.46
  for (let i = 0; i < 4; i++) {
    const u = (t / 900 + i * 0.25) % 1
    ctx.beginPath()
    ctx.strokeStyle = `rgba(255,159,28,${1 - u})`
    ctx.lineWidth = 6
    ctx.arc(cx, cy, 40 + u * 180, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.fillStyle = '#FF9F1C'
  ctx.beginPath()
  ctx.arc(cx, cy, 10, 0, Math.PI * 2)
  ctx.fill()
}

function drawHumo(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  ctx.fillStyle = '#0D1210'
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = '#253C29'
  ctx.fillRect(w * 0.08, h * 0.22, w * 0.84, h * 0.52)
  ctx.fillStyle = '#FF5A36'
  ctx.beginPath()
  ctx.arc(w * 0.72, h * 0.34 + Math.sin(t / 180) * 4, 28, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#19C37D'
  ctx.lineWidth = 8
  ctx.beginPath()
  ctx.moveTo(w * 0.18, h * 0.68)
  ctx.quadraticCurveTo(w * 0.42, h * 0.5, w * 0.68, h * 0.36)
  ctx.stroke()
  ctx.fillStyle = '#19C37D'
  ctx.beginPath()
  ctx.arc(w * 0.18, h * 0.68, 16, 0, Math.PI * 2)
  ctx.fill()
}

export function AttractLoop() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [humo, setHumo] = useState(false)

  useEffect(() => {
    const id = window.setTimeout(() => setHumo(true), PULSO_MS)
    return () => window.clearTimeout(id)
  }, [])

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
      if (humo) drawHumo(ctx, w, h, now - t0)
      else drawPulso(ctx, w, h, now - t0)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      alive = false
      cancelAnimationFrame(raf)
    }
  }, [humo])

  return (
    <div className="relative h-full w-full bg-[#0D1210]">
      <canvas ref={canvasRef} className="block h-full w-full" />
      <div className="absolute inset-x-0 top-8 text-center">
        <p className="tracking-[0.32em] text-[#19C37D]">AURA · FEXPOCRUZ</p>
        <h1 className="font-display mt-3 text-5xl text-[#F4E7CF]">{humo ? 'ANTES DEL HUMO' : 'PULSO'}</h1>
        <p className="mx-auto mt-3 max-w-sm px-6 text-lg text-[#F4E7CF]/85">
          {humo ? 'Trazá la ruta. Salvás hectáreas.' : 'El predio late. 12 segundos.'}
        </p>
      </div>
      <a
        href="/jugar"
        className="absolute inset-x-8 bottom-10 mx-auto flex min-h-14 max-w-sm items-center justify-center rounded-full bg-[#19C37D] font-display text-3xl text-[#0D1210]"
      >
        {humoCopy.cta}
      </a>
    </div>
  )
}
