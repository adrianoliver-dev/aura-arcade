'use client'

export function ArcadeBoot({ label = 'Cargando predio' }: { label?: string }) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0B0B10]">
      <p className="font-[family-name:var(--hud-font)] text-[11px] tracking-[0.36em] text-[#16B57D]">AURA ARCADE</p>
      <div className="mt-6 h-1.5 w-44 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-2/3 animate-pulse bg-[#F2A021]" />
      </div>
      <p className="mt-4 text-sm tracking-[0.18em] text-white/70">{label}</p>
    </div>
  )
}
