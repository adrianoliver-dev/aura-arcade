import { Barlow_Condensed, Source_Sans_3 } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'

import { PulsoShell } from '@/components/pulso/pulso-shell'
import { RegisterSw } from '@/components/arcade/register-sw'

import './globals.css'

const display = Barlow_Condensed({
  subsets: ['latin', 'latin-ext'],
  weight: ['600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
})

const sans = Source_Sans_3({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'AURA: ANTES DEL HUMO',
  description: 'Trazá la ruta. 40 segundos. Salvás hectáreas. Ranking de hoy.',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/Aura_logo_BG.png' },
}

export const viewport: Viewport = {
  themeColor: '#0D1210',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={`${display.variable} ${sans.variable}`}>
      <body>
        <RegisterSw />
        <PulsoShell>{children}</PulsoShell>
      </body>
    </html>
  )
}
