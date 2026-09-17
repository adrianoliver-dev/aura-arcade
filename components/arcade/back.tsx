'use client'

import Link from 'next/link'

export function ArcadeBack({ slot }: { slot: string }) {
  return (
    <Link
      href="/"
      className="absolute top-3 left-1/2 z-30 -translate-x-1/2 rounded-full border border-white/20 bg-black/50 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-white/80"
    >
      Arcade {slot}
    </Link>
  )
}
