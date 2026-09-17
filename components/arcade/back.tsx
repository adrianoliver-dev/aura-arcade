'use client'

import Link from 'next/link'

export function ArcadeBack({ slot }: { slot: string }) {
  return (
    <Link
      href="/"
      className="absolute top-[max(0.65rem,env(safe-area-inset-top))] left-3 z-30 flex min-h-[36px] items-center rounded-full border border-white/20 bg-black/60 px-3 font-[family-name:var(--hud-font)] text-[10px] uppercase tracking-[0.2em] text-white/85 backdrop-blur-sm"
    >
      Arcade {slot}
    </Link>
  )
}
