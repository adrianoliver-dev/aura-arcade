export type PlaytestRow = {
  game: string
  score: number
  at: string
  demo?: boolean
}

export function logPlaytest(game: string, score: number, demo = false) {
  const row: PlaytestRow = { game, score, at: new Date().toISOString(), demo }
  try {
    const prev = JSON.parse(localStorage.getItem('arcade:playtest') || '[]') as PlaytestRow[]
    prev.push(row)
    localStorage.setItem('arcade:playtest', JSON.stringify(prev.slice(-800)))
  } catch {
    /* private */
  }
  void fetch('/api/arcade/playtest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(row),
  }).catch(() => {
    /* offline */
  })
}
