'use client'

import { useEffect, useState } from 'react'

import { QrStand } from '@/components/arcade/qr-stand'
import { HumoGame } from '@/components/humo/humo-game'
import { PulsoGame } from '@/components/pulso/pulso-game'
import { RadioGame } from '@/components/radio/radio-game'

const SLIDES = [
  { id: 'intro', ms: 3_000, title: 'AURA ARCADE', hook: 'Fexpocruz 2026' },
  { id: 'anillos', ms: 11_000, title: 'PULSO', hook: 'Tocá al ritmo' },
  { id: 'humo', ms: 11_000, title: 'ANTES DEL HUMO', hook: 'Trazá el camino' },
  { id: 'radio', ms: 11_000, title: 'RADIO ROJA', hook: 'Agua, corte o evacuá' },
  { id: 'qr', ms: 10_000, title: 'JUGÁ GRATIS', hook: 'Escaneá el QR' },
] as const

export function ArcadeReel() {
  const [index, setIndex] = useState(0)
  const slide = SLIDES[index]!

  useEffect(() => {
    const id = window.setTimeout(() => {
      setIndex((i) => (i + 1) % SLIDES.length)
    }, slide.ms)
    return () => window.clearTimeout(id)
  }, [index, slide.ms])

  return (
    <div className="relative h-full w-full bg-[#0B0B10]">
      {slide.id === 'intro' ? (
        <div className="flex h-full flex-col items-center justify-center px-6 text-center">
          <p className="font-[family-name:var(--hud-font)] text-[11px] tracking-[0.42em] text-[#16B57D]">AURA ARCADE</p>
          <h1 className="mt-4 text-5xl font-black tracking-tight">FEXPOCRUZ</h1>
          <p className="mt-3 text-lg text-white/70">Tres retos. Un pulgar. Una ronda.</p>
        </div>
      ) : null}
      {slide.id === 'anillos' ? <PulsoGame demo /> : null}
      {slide.id === 'humo' ? <HumoGame demo /> : null}
      {slide.id === 'radio' ? <RadioGame demo /> : null}
      {slide.id === 'qr' ? <QrStand /> : null}
      {slide.id !== 'qr' && slide.id !== 'intro' ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-32 z-40 text-center">
          <p className="inline-block rounded-full bg-black/70 px-4 py-2 font-[family-name:var(--hud-font)] text-lg font-black tracking-tight text-white">
            {slide.title}
            <span className="ml-2 text-sm font-semibold text-[#F2A021]">{slide.hook}</span>
          </p>
        </div>
      ) : null}
      <div className="pointer-events-none absolute bottom-3 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1.5">
        {SLIDES.map((item, i) => (
          <span
            key={item.id}
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: i === index ? '#F2A021' : 'rgba(255,255,255,0.25)' }}
          />
        ))}
      </div>
    </div>
  )
}
