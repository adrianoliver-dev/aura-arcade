'use client'

import { ArcadeQr } from '@/components/arcade/arcade-qr'
import { HumoGame } from '@/components/humo/humo-game'
import { humoCopy } from '@/lib/humo/copy'

export function AttractLoop() {
  return (
    <div className="relative h-full w-full bg-[#0D1210]">
      <HumoGame demo />
      <div className="pointer-events-none absolute right-6 top-[max(1rem,env(safe-area-inset-top))] z-30 flex flex-col items-center gap-2">
        <ArcadeQr
          alt=""
          size={168}
          className="rounded-md bg-[#F4E7CF] p-2"
        />
        <p className="font-display text-xl tracking-wide text-[#F4E7CF]">{humoCopy.standQr}</p>
      </div>
    </div>
  )
}
