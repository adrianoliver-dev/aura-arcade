'use client'

import { useEffect } from 'react'

/** En mesa/reel: después del end, otra ronda sola. 20×90s ≈ 30 min. */
export function useDemoRematch(demo: boolean, phase: string, rematch: () => void) {
  useEffect(() => {
    if (!demo || phase !== 'end') return
    const id = window.setTimeout(() => rematch(), 2400)
    return () => window.clearTimeout(id)
  }, [demo, phase, rematch])
}
