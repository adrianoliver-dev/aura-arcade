'use client'

import { useEffect } from 'react'

export function RegisterSw() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    const id = window.setTimeout(() => {
      void navigator.serviceWorker.register('/sw.js')
    }, 800)
    return () => window.clearTimeout(id)
  }, [])
  return null
}
