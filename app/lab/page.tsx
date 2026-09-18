import Link from 'next/link'

const GAMES = [
  { href: '/jugar', title: 'ANTES DEL HUMO', meta: '40 s · trazá la respuesta', tone: 'border-[#19C37D] bg-[#19C37D]/12', state: 'JUGÁ' },
  { href: '/lab/anillos', title: 'PULSO', meta: 'Ritmo · frená los focos', tone: 'border-[#ff9f1c]/45 bg-[#ff9f1c]/8', state: 'JUGÁ' },
  { href: '/lab/radio', title: 'RADIO ROJA', meta: 'Decisión · elegí la orden', tone: 'border-[#ff5a36]/45 bg-[#ff5a36]/8', state: 'JUGÁ' },
]

export default function LabPage() {
  return (
    <main className="relative flex h-full flex-col overflow-hidden bg-[#0D1210] px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-cover bg-top opacity-35"
        style={{ backgroundImage: "url('/art/sala-aura-chiquitania-v1.png')" }}
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0D1210]/20 via-[#0D1210]/68 to-[#0D1210]" />
      <Link
        href="/"
        className="relative z-10 flex min-h-11 w-fit items-center rounded-full border border-[#F4E7CF]/35 bg-[#0D1210]/55 px-3 text-xs tracking-[0.16em] text-[#F4E7CF] backdrop-blur-sm"
      >
        ← INICIO
      </Link>
      <div className="relative z-10 mt-auto">
        <p className="text-xs uppercase tracking-[0.25em] text-[#19C37D]">AURA ARCADE</p>
        <h1 className="font-[family-name:var(--font-display)] mt-2 text-5xl text-[#F4E7CF]">Sala Aura</h1>
        <p className="mt-2 max-w-sm text-[#F4E7CF]/75">Tres retos cortos. Elegí uno, jugá una ronda y dejá tu marca.</p>
      </div>
      <ul className="relative z-10 grid gap-2">
        {GAMES.map((game) => (
          <li key={game.href}>
            <Link
              href={game.href}
              className={`flex min-h-16 items-center justify-between rounded-2xl border px-4 text-[#F4E7CF] ${game.tone}`}
            >
              <span>
                <span className="block font-[family-name:var(--font-display)] text-xl">{game.title}</span>
                <span className="mt-0.5 block text-xs text-[#F4E7CF]/65">{game.meta}</span>
              </span>
              <span className="rounded-full bg-[#F4E7CF]/10 px-2 py-1 text-[10px] tracking-[0.14em] text-[#F4E7CF]">{game.state}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
