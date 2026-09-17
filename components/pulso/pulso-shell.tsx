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
    <div className="pulso-shell relative h-[100dvh] w-full overflow-hidden overscroll-none bg-[#0A0A0F] text-white antialiased [touch-action:manipulation] [user-select:none]">
      {children}
    </div>
  )
}
