'use client'

import { useEffect, useState } from 'react'

import { QrStand } from '@/components/arcade/qr-stand'
import { HumoGame } from '@/components/humo/humo-game'
import { MuroGame } from '@/components/muro/muro-game'
import { PulsoGame } from '@/components/pulso/pulso-game'
import { RadioGame } from '@/components/radio/radio-game'
import { SalidaGame } from '@/components/salida/salida-game'

const SLIDES = [
  { id: 'anillos', ms: 12_000 },
  { id: 'humo', ms: 12_000 },
  { id: 'radio', ms: 12_000 },
  { id: 'muro', ms: 12_000 },
  { id: 'salida', ms: 12_000 },
  { id: 'qr', ms: 8_000 },
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
    <div className="relative h-full w-full">
      {slide.id === 'anillos' ? <PulsoGame demo /> : null}
      {slide.id === 'humo' ? <HumoGame demo /> : null}
      {slide.id === 'radio' ? <RadioGame demo /> : null}
      {slide.id === 'muro' ? <MuroGame demo /> : null}
      {slide.id === 'salida' ? <SalidaGame demo /> : null}
      {slide.id === 'qr' ? <QrStand /> : null}
      <p className="pointer-events-none absolute bottom-3 left-1/2 z-40 -translate-x-1/2 font-[family-name:var(--hud-font)] text-[10px] tracking-[0.28em] text-white/40">
        AURA ARCADE · FEXPOCRUZ · {index + 1}/{SLIDES.length}
      </p>
    </div>
  )
}
