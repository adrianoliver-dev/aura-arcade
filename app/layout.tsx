import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'

import { PulsoShell } from '@/components/pulso/pulso-shell'

import './globals.css'

export const metadata: Metadata = {
  title: 'Aura Arcade · Fexpocruz',
  description: 'Juegos de stand Aura. Repo aparte de producción.',
}

export const viewport: Viewport = {
  themeColor: '#0A0A0F',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <PulsoShell>{children}</PulsoShell>
      </body>
    </html>
  )
}
