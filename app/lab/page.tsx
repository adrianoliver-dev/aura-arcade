import Link from 'next/link'

const GAMES = [
  { href: '/jugar', title: 'ANTES DEL HUMO', meta: '40 s · modo de stand', tone: 'border-[#19C37D] bg-[#19C37D]/12', state: 'LISTO' },
  { href: '/lab/anillos', title: 'PULSO', meta: 'Ritmo · laboratorio', tone: 'border-[#ff9f1c]/45 bg-[#ff9f1c]/8', state: 'TALLER' },
  { href: '/lab/radio', title: 'RADIO ROJA', meta: 'Decisión · laboratorio', tone: 'border-[#ff5a36]/45 bg-[#ff5a36]/8', state: 'TALLER' },
  { href: '/lab/muro', title: 'MURO', meta: 'Estrategia · laboratorio', tone: 'border-[#b9a7ff]/45 bg-[#b9a7ff]/8', state: 'TALLER' },
  { href: '/lab/salida', title: 'SALIDA', meta: 'Reflejos · laboratorio', tone: 'border-[#7ddc68]/45 bg-[#7ddc68]/8', state: 'TALLER' },
]

export default function LabPage() {
  return (
    <main className="relative flex h-full flex-col bg-[#0D1210] px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <Link
        href="/"
        className="flex min-h-11 w-fit items-center rounded-full border border-[#F4E7CF]/35 px-3 text-xs tracking-[0.16em] text-[#F4E7CF]"
      >
        ← INICIO
      </Link>
      <div className="mt-auto">
        <p className="text-xs uppercase tracking-[0.25em] text-[#19C37D]">AURA ARCADE</p>
        <h1 className="font-[family-name:var(--font-display)] mt-2 text-5xl text-[#F4E7CF]">Sala Aura</h1>
        <p className="mt-2 max-w-sm text-[#F4E7CF]/75">HUMO es el modo de stand. Los demás siguen en taller y necesitan su propia pasada de producción.</p>
      </div>
      <ul className="grid gap-2">
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
              <span className="text-[10px] tracking-[0.14em] text-[#F4E7CF]/75">{game.state}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
