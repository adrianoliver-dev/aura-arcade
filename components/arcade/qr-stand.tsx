'use client'

const DEFAULT_URL = 'https://github.com/adrianoliver-dev/aura-arcade'

export function QrStand() {
  const url = process.env.NEXT_PUBLIC_ARCADE_URL || DEFAULT_URL

  return (
    <main className="flex h-full flex-col items-center justify-center gap-4 bg-[#0B0B10] px-6 text-center">
      <p className="font-[family-name:var(--hud-font)] text-[11px] tracking-[0.36em] text-[#16B57D]">AURA ARCADE</p>
      <h1 className="text-4xl font-black tracking-tight">Jugá gratis</h1>
      <p className="max-w-xs text-base text-white/70">Escaneá. Cinco juegos. Un pulgar. Ranking de hoy.</p>
      <img
        src="/qr-arcade.png"
        alt={`QR para jugar en ${url}`}
        width={280}
        height={280}
        className="rounded-2xl bg-white p-3"
      />
      <p className="max-w-xs break-all font-[family-name:var(--hud-font)] text-[11px] text-[#F2A021]">{url}</p>
    </main>
  )
}
