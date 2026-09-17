'use client'

export function ArcadeBoot({ label = 'Cargando predio' }: { label?: string }) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0B0B10]">
      <p className="font-[family-name:var(--hud-font)] text-[11px] tracking-[0.36em] text-[#16B57D]">AURA ARCADE</p>
      <div className="mt-6 h-1 w-40 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-1/2 animate-pulse bg-[#F2A021]" />
      </div>
      <p className="mt-4 text-[11px] tracking-[0.2em] text-white/50">{label}</p>
    </div>
  )
}
