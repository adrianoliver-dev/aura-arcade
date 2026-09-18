export function loadXp(): number {
  try {
    return Math.max(0, Number(localStorage.getItem('arcade:xp') || 0) || 0)
  } catch {
    return 0
  }
}

export function addXp(n: number): number {
  const next = loadXp() + Math.max(0, Math.round(n))
  try {
    localStorage.setItem('arcade:xp', String(next))
  } catch {
    /* */
  }
  return next
}

/** Calor 1–5. Sube con XP total, no con un solo round. */
export function heatFromXp(xp: number): 1 | 2 | 3 | 4 | 5 {
  if (xp >= 2200) return 5
  if (xp >= 1200) return 4
  if (xp >= 600) return 3
  if (xp >= 200) return 2
  return 1
}

export function heatLabel(h: number): string {
  return `Calor ${h}`
}

export function missionFor(game: string, heat: number): { label: string; hint: string } {
  const table: Record<string, { label: string; hint: string }[]> = {
    anillos: [
      { label: '3 perfectos', hint: 'El anillo cierra en el centro' },
      { label: 'Racha 6', hint: 'No falles el rush' },
      { label: '1200 pts', hint: 'Calor 3 pide combo' },
    ],
    humo: [
      { label: 'Llegá a 3 focos', hint: 'Trazá desde el nodo' },
      { label: '40 ha', hint: 'Cortá el monte, no el agua' },
      { label: 'Todos llegaron', hint: 'Cadena de brigada' },
    ],
    radio: [
      { label: '8 bien', hint: 'Leé la pista, no el pánico' },
      { label: 'Sin casas caídas', hint: 'Munición limitada' },
      { label: 'x5 racha', hint: 'No spamées el mismo botón' },
    ],
  }
  const rows = table[game] ?? table.radio!
  return rows[Math.min(heat - 1, rows.length - 1)]!
}

export function xpFromScore(score: number): number {
  return Math.max(1, Math.round(score / 12))
}
