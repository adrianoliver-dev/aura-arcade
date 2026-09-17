'use client'

export function ArcadeBoot({ label = 'Cargando predio' }: { label?: string }) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center overflow-hidden bg-[#0B0B10]">
      <div className="pointer-events-none absolute inset-0 opacity-30 [background:repeating-linear-gradient(0deg,transparent,transparent_3px,#16B57D11_4px)]" />
      <div className="aura-boot-ring mb-6 h-24 w-24 rounded-full border-2 border-[#16B57D]/70" />
      <p className="relative font-[family-name:var(--hud-font)] text-[11px] tracking-[0.42em] text-[#16B57D]">AURA ARCADE</p>
      <div className="relative mt-5 h-1.5 w-52 overflow-hidden rounded-full bg-white/10">
        <div className="aura-boot-bar h-full w-1/3 rounded-full bg-[#F2A021]" />
      </div>
      <p className="relative mt-4 text-sm tracking-[0.2em] text-white/70">{label}</p>
    </div>
  )
}
