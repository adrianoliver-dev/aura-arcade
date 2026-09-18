'use client'

import { ArcadeQr } from '@/components/arcade/arcade-qr'
import { humoCopy } from '@/lib/humo/copy'
import { arcadePlayHostLabel, arcadeQrTarget } from '@/lib/pulso/social'

export function QrStand() {
  return (
    <main className="flex h-full flex-col items-center justify-center gap-4 bg-[#0D1210] px-6 text-center">
      <p className="tracking-[0.32em] text-[#19C37D]">AURA</p>
      <h1 className="font-display text-5xl text-[#F4E7CF]">{humoCopy.cta}</h1>
      <p className="max-w-xs text-lg text-[#F4E7CF]/80">Escaneá. Trazá la ruta. 40 segundos.</p>
      <ArcadeQr
        alt={`QR para jugar en ${arcadeQrTarget()}`}
        size={360}
        className="rounded-2xl bg-[#F4E7CF] p-3"
      />
      <a href="/jugar" className="min-h-12 min-w-48 rounded-full bg-[#19C37D] px-6 py-3 font-display text-2xl text-[#0D1210]">
        {humoCopy.cta}
      </a>
      <p className="max-w-xs break-all text-sm text-[#C99052]">{arcadePlayHostLabel()}</p>
    </main>
  )
}
