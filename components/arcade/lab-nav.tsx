'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function LabNav() {
  const pathname = usePathname()
  if (pathname === '/lab') return null

  return (
    <nav className="pointer-events-none absolute top-[max(0.5rem,env(safe-area-inset-top))] left-3 z-40">
      <Link
        href="/lab"
        className="pointer-events-auto inline-flex min-h-12 min-w-12 items-center rounded-full border border-[#C99052]/40 bg-[#0D1210]/80 px-4 text-sm text-[#F4E7CF] backdrop-blur-sm"
      >
        Sala
      </Link>
    </nav>
  )
}
