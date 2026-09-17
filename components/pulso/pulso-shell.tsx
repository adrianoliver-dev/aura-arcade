'use client'

import { useEffect, type ReactNode } from 'react'

export function PulsoShell({ children }: { children: ReactNode }) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const prevent = (event: TouchEvent) => {
      if (event.touches.length > 1) event.preventDefault()
    }
    document.addEventListener('touchmove', prevent, { passive: false })
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('touchmove', prevent)
    }
  }, [])

  return (
    <div className="pulso-shell relative h-[100dvh] w-full overflow-hidden overscroll-none bg-[#0D1210] text-[#F4E7CF] antialiased [touch-action:manipulation] [user-select:none]">
      {children}
    </div>
  )
}
