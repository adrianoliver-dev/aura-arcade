'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import type { BoardEntry } from '@/lib/pulso/types'

type Game = 'humo' | 'pulso' | 'radio'
type Boards = Record<Game, BoardEntry[]>

const TABS: Array<{ id: Game; label: string; unit: string; tone: string }> = [
  { id: 'humo', label: 'HUMO', unit: 'ha', tone: '#19C37D' },
  { id: 'pulso', label: 'PULSO', unit: 'pts', tone: '#F2A021' },
  { id: 'radio', label: 'RADIO', unit: 'pts', tone: '#EC5A45' },
]

const EMPTY: Boards = { humo: [], pulso: [], radio: [] }

export function ArcadeRanking() {
  const [boards, setBoards] = useState<Boards>(EMPTY)
  const [tab, setTab] = useState<Game>('humo')
  const [loading, setLoading] = useState(true)
  const [kiosk, setKiosk] = useState(false)

  useEffect(() => {
    let live = true
    const load = async () => {
      try {
        const response = await fetch('/api/arcade/leaderboard', { cache: 'no-store' })
        if (!response.ok) throw new Error('leaderboard')
        const data = (await response.json()) as Partial<Boards>
        if (live) setBoards({ humo: data.humo ?? [], pulso: data.pulso ?? [], radio: data.radio ?? [] })
      } catch {
        // No tapar el ranking local con un error de red.
      } finally {
        if (live) setLoading(false)
      }
    }
    void load()
    const timer = window.setInterval(() => void load(), 15_000)
    return () => {
      live = false
      window.clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    const enabled = new URLSearchParams(window.location.search).get('kiosk') === '1'
    setKiosk(enabled)
    if (!enabled) return
    const timer = window.setInterval(() => {
      setTab((current) => TABS[(TABS.findIndex((item) => item.id === current) + 1) % TABS.length]!.id)
    }, 8_000)
    return () => window.clearInterval(timer)
  }, [])

  const current = TABS.find((item) => item.id === tab)!
  const rows = boards[tab]
  return (
    <main className="relative flex min-h-full overflow-hidden bg-[#0A1410] px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] text-[#F4E7CF]">
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#19C37D22,transparent_50%),linear-gradient(135deg,#0A1410,#101E15)]" />
      <section className="relative mx-auto flex w-full max-w-5xl flex-col">
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="font-[family-name:var(--hud-font)] text-[10px] tracking-[.28em] text-[#19C37D]">AURA ARCADE · FEXPOCRUZ</p>
            <h1 className="mt-2 text-4xl font-black leading-none">RANKING DE HOY</h1>
          </div>
          {!kiosk ? <Link href="/lab" className="inline-flex min-h-11 items-center rounded-full border border-white/20 px-3 text-[10px] font-semibold tracking-[.13em]">← SALA</Link> : <span className="rounded-full border border-[#19C37D]/40 px-3 py-2 text-[10px] font-semibold tracking-[.13em] text-[#19C37D]">DESAFIÁ LA MARCA</span>}
        </header>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-[#F4E7CF]/68">Cada reto tiene su propia medida. No mezclamos hectáreas con puntos: elegí una marca y tratá de superarla.</p>
        <div className="mt-6 grid gap-5 md:grid-cols-[minmax(0,1.35fr)_minmax(17rem,.65fr)]">
          <div>
            <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-black/20 p-1.5">
              {TABS.map((item) => <button key={item.id} type="button" onClick={() => setTab(item.id)} className={`min-h-11 rounded-xl text-xs font-black tracking-[.12em] transition ${tab === item.id ? 'text-[#09120F]' : 'text-[#F4E7CF]/55'}`} style={tab === item.id ? { background: item.tone } : undefined}>{item.label}</button>)}
            </div>
            <ol className="mt-4 space-y-2">
              {loading ? <li className="rounded-2xl border border-white/10 bg-white/5 px-4 py-5 text-sm text-[#F4E7CF]/58">Actualizando marcas…</li> : null}
              {!loading && rows.length === 0 ? <li className="rounded-2xl border border-white/10 bg-white/5 px-4 py-5 text-sm text-[#F4E7CF]/58">Todavía no hay una marca publicada. La primera puede ser tuya.</li> : null}
              {rows.slice(0, 10).map((row, index) => <li key={row.id} className="flex min-h-14 items-center gap-3 rounded-2xl border border-white/10 bg-white/[.055] px-4"><span className="w-6 text-center text-lg font-black" style={{ color: index < 3 ? current.tone : '#F4E7CF88' }}>{index + 1}</span><span className="min-w-0 flex-1 truncate font-semibold">{row.alias}<small className="ml-2 text-[10px] tracking-[.13em] text-[#F4E7CF]/45">{row.tag}</small></span><strong className="tabular-nums" style={{ color: current.tone }}>{row.score} <small className="text-[10px] text-[#F4E7CF]/55">{current.unit}</small></strong></li>)}
            </ol>
          </div>
          <aside className="relative overflow-hidden rounded-[1.7rem] border border-white/12 bg-[#0B1912]/80 p-6 shadow-[0_24px_64px_rgba(0,0,0,.25)]">
            <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full blur-3xl" style={{ background: `${current.tone}33` }} />
            <p className="relative font-[family-name:var(--hud-font)] text-[10px] tracking-[.24em]" style={{ color: current.tone }}>MARCA ACTIVA</p>
            <p className="relative mt-4 text-4xl font-black leading-[.9] tracking-[-.05em]">¿QUIÉN SUBE<br />A LA CIMA?</p>
            <p className="relative mt-4 text-sm leading-relaxed text-[#F4E7CF]/66">Jugá una ronda, publicá tu apodo y volvé a mirar esta pantalla.</p>
            <div className="relative mt-6 flex items-end gap-2"><strong className="text-5xl font-black" style={{ color: current.tone }}>{rows[0]?.score ?? '—'}</strong><span className="mb-1 text-sm text-[#F4E7CF]/55">{current.unit} · hoy</span></div>
            <p className="relative mt-6 border-t border-white/10 pt-4 text-[10px] font-semibold tracking-[.14em] text-[#19C37D]">{kiosk ? 'PANTALLA EN ROTACIÓN' : 'ABRÍ ?KIOSK=1 EN EL MONITOR'}</p>
          </aside>
        </div>
        <p className="mt-auto pt-6 text-center text-[10px] tracking-[.13em] text-[#F4E7CF]/42">SE ACTUALIZA CADA 15 S{kiosk ? ' · ROTACIÓN ACTIVA' : ' · MODO MONITOR: /LAB/RANKING?KIOSK=1'}</p>
      </section>
    </main>
  )
}
