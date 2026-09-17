'use client'

import { useMemo } from 'react'

const DEFAULT_URL = 'https://github.com/adrianoliver-dev/aura-arcade'

export function QrStand() {
  const url = process.env.NEXT_PUBLIC_ARCADE_URL || DEFAULT_URL
  const src = useMemo(() => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(url)}`
  }, [url])

  return (
    <main className="flex h-full flex-col items-center justify-center gap-5 px-6 text-center">
      <p className="font-[family-name:var(--hud-font)] text-[11px] tracking-[0.36em] text-[#16B57D]">AURA ARCADE</p>
      <h1 className="text-3xl font-black">Escaneá y jugá</h1>
      <img src={src} alt="QR Aura Arcade" width={280} height={280} className="rounded-xl bg-white p-3" />
      <p className="max-w-xs text-sm text-white/65">{url}</p>
    </main>
  )
}
