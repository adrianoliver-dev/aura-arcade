'use client'

import { humoCopy } from '@/lib/humo/copy'

const DEFAULT_URL = 'https://github.com/adrianoliver-dev/aura-arcade'

export function QrStand() {
  const url = process.env.NEXT_PUBLIC_ARCADE_URL || DEFAULT_URL

  return (
    <main className="flex h-full flex-col items-center justify-center gap-4 bg-[#0D1210] px-6 text-center">
      <p className="tracking-[0.32em] text-[#19C37D]">AURA</p>
      <h1 className="font-display text-5xl text-[#F4E7CF]">{humoCopy.cta}</h1>
      <p className="max-w-xs text-lg text-[#F4E7CF]/80">Escaneá. Trazá la ruta. 40 segundos.</p>
      <img
        src="/qr-arcade.png"
        alt={`QR para jugar en ${url}`}
        width={280}
        height={280}
        className="rounded-2xl bg-[#F4E7CF] p-3"
      />
      <a href="/jugar" className="min-h-12 min-w-48 rounded-full bg-[#19C37D] px-6 py-3 font-display text-2xl text-[#0D1210]">
        {humoCopy.cta}
      </a>
      <p className="max-w-xs break-all text-sm text-[#C99052]">{url}</p>
    </main>
  )
}
