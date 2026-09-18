import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import { LabNav } from '@/components/arcade/lab-nav'

export const metadata: Metadata = {
  title: 'Laboratorio · Aura Arcade',
  robots: { index: false, follow: false },
}

export default function LabLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-full">
      <LabNav />
      {children}
    </div>
  )
}
