/** Récord local por juego. Nunca cruzar hectáreas de HUMO con pts de PULSO. */

export const HUMO_HA_CAP = 400

export function humoLegacyBest(raw: number): number {
  if (!Number.isFinite(raw) || raw <= 0) return 0
  if (raw > HUMO_HA_CAP) return 0
  return Math.round(raw)
}

function readNum(key: string): number {
  try {
    return Math.max(0, Number(localStorage.getItem(key) || 0) || 0)
  } catch {
    return 0
  }
}

function writeNum(key: string, n: number): void {
  try {
    localStorage.setItem(key, String(n))
  } catch {
    /* private mode */
  }
}

function dropKeys(keys: string[]): void {
  try {
    for (const key of keys) localStorage.removeItem(key)
  } catch {
    /* private mode */
  }
}

export function loadGameBest(game: string): number {
  const arcade = readNum(`arcade:pb:${game}`)
  if (game === 'humo') {
    const cleaned = humoLegacyBest(arcade)
    const legacy = humoLegacyBest(readNum('humo:pb'))
    if (arcade > HUMO_HA_CAP || readNum('humo:pb') > HUMO_HA_CAP) {
      dropKeys(['arcade:pb:humo', 'humo:pb'])
      const recovered = Math.max(cleaned, legacy)
      if (recovered > 0) writeNum('arcade:pb:humo', recovered)
      return recovered
    }
    return Math.max(cleaned, legacy)
  }
  if (game === 'anillos') {
    return Math.max(arcade, readNum('pulso:pb'))
  }
  return arcade
}

export function saveGameBest(game: string, n: number): number {
  const score = Math.max(0, Number(n) || 0)
  if (game === 'humo' && score > HUMO_HA_CAP) return loadGameBest(game)
  const prev = loadGameBest(game)
  const next = Math.max(prev, score)
  writeNum(`arcade:pb:${game}`, next)
  return next
}

export function loadPlays(game: string): number {
  const arcade = readNum(`arcade:plays:${game}`)
  if (arcade > 0) return arcade
  if (game === 'humo') return readNum('humo:plays')
  return 0
}

export function bumpPlays(game: string): number {
  const next = loadPlays(game) + 1
  writeNum(`arcade:plays:${game}`, next)
  return next
}

export function recordPlay(game: string, score: number): { prevBest: number; best: number; plays: number } {
  const prevBest = loadGameBest(game)
  const best = saveGameBest(game, score)
  const plays = bumpPlays(game)
  return { prevBest, best, plays }
}

export function ligaName(score: number): string {
  if (score >= 300) return 'Liga 5'
  if (score >= 200) return 'Liga 4'
  if (score >= 120) return 'Liga 3'
  if (score >= 50) return 'Liga 2'
  return 'Liga 1'
}
