import Link from 'next/link'

const GAMES = [
  { href: '/lab/anillos', title: 'PULSO' },
  { href: '/lab/radio', title: 'RADIO ROJA' },
  { href: '/lab/muro', title: 'MURO' },
  { href: '/lab/salida', title: 'SALIDA' },
]

export default function LabPage() {
  return (
    <main className="flex h-full flex-col justify-end gap-3 bg-[#0D1210] px-6 pb-16">
      <p className="text-xs uppercase tracking-[0.25em] text-[#C99052]">Post-evento</p>
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[#F4E7CF]">Laboratorio</h1>
      <p className="max-w-sm text-[#F4E7CF]/75">Prototipos. No salen en el stand.</p>
      <ul className="grid gap-2">
        {GAMES.map((game) => (
          <li key={game.href}>
            <Link
              href={game.href}
              className="flex min-h-12 items-center rounded-2xl border border-[#3E5A32] bg-[#253C29] px-4 text-[#F4E7CF]"
            >
              {game.title}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
