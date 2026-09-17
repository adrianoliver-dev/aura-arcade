export function loadGameBest(game: string): number {
  try {
    const arcade = Number(localStorage.getItem(`arcade:pb:${game}`) || 0) || 0
    const legacyKey = game === 'humo' ? 'humo:pb' : game === 'anillos' ? 'pulso:pb' : null
    const legacy = legacyKey ? Number(localStorage.getItem(legacyKey) || 0) || 0 : 0
    return Math.max(0, arcade, legacy)
  } catch {
    return 0
  }
}

export function saveGameBest(game: string, n: number): void {
  try {
    const prev = loadGameBest(game)
    if (n > prev) localStorage.setItem(`arcade:pb:${game}`, String(n))
  } catch {
    /* */
  }
}

export function ligaName(score: number): string {
  if (score >= 300) return 'Liga 5'
  if (score >= 200) return 'Liga 4'
  if (score >= 120) return 'Liga 3'
  if (score >= 50) return 'Liga 2'
  return 'Liga 1'
}
