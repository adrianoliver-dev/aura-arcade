'use client'

import { useEffect, useSyncExternalStore, type ReactNode } from 'react'

const emptySubscribe = () => () => {}

export function PulsoShell({ children }: { children: ReactNode }) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)

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
    <div className="pulso-shell relative h-[100dvh] w-full overflow-hidden overscroll-none bg-[#0A0A0F] text-white antialiased [touch-action:none] [user-select:none]">
      {mounted ? children : null}
    </div>
  )
}
