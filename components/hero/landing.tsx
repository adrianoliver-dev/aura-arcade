'use client'

import { useEffect, useRef } from 'react'

import { ArcadeQr } from '@/components/arcade/arcade-qr'
import { humoCopy } from '@/lib/humo/copy'
import { createWorld, daySeed, MATCH_MS, firstGuidePath, normOfCell } from '@/lib/humo/sim'
import { drawFrame, gridLayout } from '@/components/humo/humo-fx'

export function HeroLanding() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const world = createWorld(daySeed())
    const guide = firstGuidePath(world).map(normOfCell)
    let raf = 0
    let alive = true
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
      drawFrame(ctx, w, h, {
        world,
        phase: 'ready',
        t: 0,
        now,
        juice: [],
        drawing: null,
        strokes: [],
        saved: [],
        ghost: [],
        particles: [],
        floaters: [],
        shocks: [],
        layout: gridLayout(w, h),
        shake: 0,
        flash: 0,
        flashTint: 'fire',
        onRoad: true,
        clutch: false,
        hint: true,
        canAct: true,
        guide,
        runner: null,
        eta: null,
        reduced: true,
      })
      raf = window.requestAnimationFrame(loop)
    }
    raf = window.requestAnimationFrame(loop)
    return () => {
      alive = false
      window.cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <main className="relative flex h-full flex-col bg-[#0D1210]">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />
      <div className="relative z-10 flex h-full flex-col justify-end bg-gradient-to-t from-[#0D1210] via-[#0D1210]/55 to-transparent px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
        <p className="text-sm tracking-[0.32em] text-[#19C37D]">AURA</p>
        <h1 className="font-display mt-2 max-w-xl text-5xl leading-[0.95] text-[#F4E7CF] md:text-7xl">
          {humoCopy.landingAsk}
        </h1>
        <p className="mt-3 max-w-md text-lg text-[#F4E7CF]/85">Hay fuego. Hay un predio. Llevá la respuesta desde la base.</p>
        <a
          href="/jugar"
          className="mt-6 inline-flex min-h-14 w-full max-w-sm items-center justify-center rounded-full bg-[#19C37D] font-display text-3xl text-[#0D1210]"
        >
          {humoCopy.cta}
        </a>
        <a
          href="/lab"
          className="mt-3 inline-flex min-h-11 w-fit items-center text-sm tracking-[0.14em] text-[#F4E7CF]/75 underline decoration-[#19C37D]/70 underline-offset-4"
        >
          VER SALA AURA
        </a>
        <div className="mt-4 flex items-center gap-3">
          <ArcadeQr alt={humoCopy.standQr} size={88} className="rounded-md bg-[#F4E7CF] p-1" />
          <p className="text-sm text-[#C99052]">
            {Math.round(MATCH_MS / 1000)} segundos · un pulgar
            <br />
            {humoCopy.standQr}
          </p>
        </div>
      </div>
    </main>
  )
}
