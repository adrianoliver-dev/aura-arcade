import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Laboratorio · Aura Arcade',
  robots: { index: false, follow: false },
}

export default function LabLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-full">
      <nav className="pointer-events-none absolute top-[max(0.5rem,env(safe-area-inset-top))] left-3 z-40">
        <Link
          href="/"
          className="pointer-events-auto inline-flex min-h-12 min-w-12 items-center rounded-full border border-[#C99052]/40 bg-[#0D1210]/80 px-4 text-sm text-[#F4E7CF]"
        >
          Salir
        </Link>
      </nav>
      {children}
    </div>
  )
}
