export type GameStatus = 'live' | 'soon'

export type ArcadeGame = {
  id: string
  href: string
  title: string
  blurb: string
  status: GameStatus
  n: number
}

export const ARCADE_GAMES: ArcadeGame[] = [
  {
    id: 'anillos',
    href: '/anillos',
    n: 1,
    title: 'PULSO',
    blurb: 'Anillos. Tocá al ritmo.',
    status: 'live',
  },
  {
    id: 'humo',
    href: '/humo',
    n: 2,
    title: 'ANTES DEL HUMO',
    blurb: 'Ruta al fuego. Salvás hectáreas.',
    status: 'live',
  },
  {
    id: 'slot-3',
    href: '#',
    n: 3,
    title: 'PRÓXIMO',
    blurb: 'Slot libre para el 3.',
    status: 'soon',
  },
  {
    id: 'slot-4',
    href: '#',
    n: 4,
    title: 'PRÓXIMO',
    blurb: 'Slot libre para el 4.',
    status: 'soon',
  },
  {
    id: 'slot-5',
    href: '#',
    n: 5,
    title: 'PRÓXIMO',
    blurb: 'Slot libre para el 5.',
    status: 'soon',
  },
]
