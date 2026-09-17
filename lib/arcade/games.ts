export type GameStatus = 'live' | 'soon'

export type ArcadeGame = {
  id: 'anillos' | 'humo' | 'radio' | 'muro' | 'salida'
  href: string
  title: string
  blurb: string
  promise: string
  status: GameStatus
  n: number
  accent: string
}

export const ARCADE_GAMES: ArcadeGame[] = [
  {
    id: 'anillos',
    href: '/anillos',
    n: 1,
    title: 'PULSO',
    blurb: 'Anillos. Tocá al ritmo.',
    promise: 'El anillo cierra. Tocá ahora.',
    status: 'live',
    accent: '#F2A021',
  },
  {
    id: 'humo',
    href: '/humo',
    n: 2,
    title: 'ANTES DEL HUMO',
    blurb: 'Ruta al fuego. Salvás hectáreas.',
    promise: 'Trazá el camino. El fuego no espera.',
    status: 'live',
    accent: '#16B57D',
  },
  {
    id: 'radio',
    href: '/radio',
    n: 3,
    title: 'RADIO ROJA',
    blurb: 'El predio llama. Tres botones. Munición corta.',
    promise: 'Agua, corte o evacuá. Ya.',
    status: 'live',
    accent: '#E34B34',
  },
  {
    id: 'muro',
    href: '/muro',
    n: 4,
    title: 'MURO',
    blurb: 'Anillá la casa. Stock corto. El fuego da la vuelta.',
    promise: 'Ocho muros. Un anillo. La casa no puede caer.',
    status: 'live',
    accent: '#C4B5FD',
  },
  {
    id: 'salida',
    href: '/salida',
    n: 5,
    title: 'SALIDA',
    blurb: 'Tres sendas. Evitá el fuego. Sacá a la gente.',
    promise: 'Cambiá de carril. No pares.',
    status: 'live',
    accent: '#7DDC68',
  },
]
