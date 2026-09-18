'use client'

import Link from 'next/link'

import { PULSO_PUBLIC_URL } from '@/lib/pulso/social'

export function SalaActions() {
  const share = async () => {
    const text = 'Tres retos cortos de AURA ARCADE. ¿Me ganás en Fexpocruz?'
    const url = PULSO_PUBLIC_URL.includes('127.0.0.1') ? window.location.origin : PULSO_PUBLIC_URL
    try {
      if (navigator.share) {
        await navigator.share({ title: 'AURA ARCADE', text, url })
        return
      }
      await navigator.clipboard.writeText(`${text} ${url}`)
    } catch {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`${text} ${url}`)}`, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div className="relative z-10 flex items-center gap-2">
      <Link href="/lab/ranking" className="inline-flex min-h-11 items-center rounded-full border border-[#F4E7CF]/28 bg-[#0D1210]/55 px-3 text-[10px] font-semibold tracking-[.14em] text-[#F4E7CF] backdrop-blur-md">
        RANKING
      </Link>
      <button type="button" onClick={() => void share()} className="inline-flex min-h-11 items-center rounded-full border border-[#19C37D]/50 bg-[#19C37D]/12 px-3 text-[10px] font-semibold tracking-[.14em] text-[#DDFCE9] backdrop-blur-md">
        COMPARTIR
      </button>
    </div>
  )
}
