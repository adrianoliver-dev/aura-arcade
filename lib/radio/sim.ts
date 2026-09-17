/** RADIO ROJA — jefe de brigada. Decisiones con reloj. Determinista. */

export const MATCH_MS = 90_000
export const HOUSES = 3

export type Action = 'agua' | 'corte' | 'evacua'

export type Call = {
  id: number
  appearMs: number
  commitMs: number
  correct: Action
  stake: number
  prompt: string
  clue: string
}

export type Decision = {
  id: number
  action: Action
  t: number
}

export type RadioResult = {
  score: number
  comboMax: number
  saves: number
  misses: number
  housesLeft: number
  answered: number
}

const PROMPTS: { prompt: string; clue: string; correct: Action; stake: number }[] = [
  { prompt: 'Casa al viento. El techo ya prende.', clue: 'Gente adentro', correct: 'evacua', stake: 18 },
  { prompt: 'El chaco se come el camino.', clue: 'No hay casas cerca', correct: 'corte', stake: 22 },
  { prompt: 'Tanque a 400 m. Cultivo seco.', clue: 'Hay agua', correct: 'agua', stake: 16 },
  { prompt: 'Galpón con peones. Humo negro.', clue: 'Personas', correct: 'evacua', stake: 24 },
  { prompt: 'Faja de monte. El predio es largo.', clue: 'Línea de fuego', correct: 'corte', stake: 20 },
  { prompt: 'Pileta llena. El foco es chico.', clue: 'Lo apagás', correct: 'agua', stake: 14 },
  { prompt: 'Escuela a favor del viento.', clue: 'Sacá a la gente', correct: 'evacua', stake: 28 },
  { prompt: 'Potrero abierto. Viento norte.', clue: 'Cortá ahora', correct: 'corte', stake: 19 },
  { prompt: 'Manguera en el nodo. Foco al lado.', clue: 'Agua ya', correct: 'agua', stake: 15 },
  { prompt: 'Familia en la loma. El fuego sube.', clue: 'Evacuá', correct: 'evacua', stake: 26 },
  { prompt: 'Dos focos. El camino los une.', clue: 'Rompe el puente', correct: 'corte', stake: 21 },
  { prompt: 'Estanque. El borde ya prende.', clue: 'Tirale agua', correct: 'agua', stake: 17 },
  { prompt: 'El viento cambió. Hay un corral.', clue: 'Animales y gente', correct: 'evacua', stake: 23 },
  { prompt: 'Rastrojo seco entre dos chacos.', clue: 'Cortafuego', correct: 'corte', stake: 20 },
]

function mulberryStep(rng: number): { rng: number; value: number } {
  let a = (rng + 0x6d2b79f5) | 0
  let t = Math.imul(a ^ (a >>> 15), 1 | a)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return { rng: a, value: ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

export function buildCalls(seed: number): Call[] {
  let rng = seed | 0
  const rand = () => {
    const step = mulberryStep(rng)
    rng = step.rng
    return step.value
  }
  const calls: Call[] = []
  let t = 400
  for (let i = 0; i < 14; i++) {
    const row = PROMPTS[Math.floor(rand() * PROMPTS.length)]!
    const window = Math.max(3800, 7200 - i * 220)
    const appearMs = t
    const commitMs = Math.min(MATCH_MS - 200, appearMs + window)
    calls.push({
      id: i,
      appearMs,
      commitMs,
      correct: row.correct,
      stake: row.stake + Math.floor(i * 0.8),
      prompt: row.prompt,
      clue: row.clue,
    })
    t += Math.floor(window * 0.72)
    if (t > MATCH_MS - 4500) break
  }
  return calls
}

export function liveCall(t: number, calls: Call[], done: Set<number>): Call | null {
  const open = calls.filter((c) => t >= c.appearMs && t < c.commitMs && !done.has(c.id))
  if (!open.length) return null
  return open.reduce((a, b) => (a.commitMs <= b.commitMs ? a : b))
}

export function simulateRun(seed: number, decisions: Decision[]): RadioResult {
  const calls = buildCalls(seed)
  const byId = new Map(decisions.map((d) => [d.id, d]))
  let score = 0
  let combo = 0
  let comboMax = 0
  let saves = 0
  let misses = 0
  let housesLeft = HOUSES
  let answered = 0
  for (const call of calls) {
    const d = byId.get(call.id)
    if (!d || d.t > call.commitMs || d.t < call.appearMs) {
      misses += 1
      combo = 0
      housesLeft = Math.max(0, housesLeft - 1)
      continue
    }
    answered += 1
    if (d.action === call.correct) {
      combo += 1
      comboMax = Math.max(comboMax, combo)
      const bonus = 1 + Math.min(combo - 1, 5) * 0.15
      score += Math.round(call.stake * bonus)
      saves += 1
    } else {
      misses += 1
      combo = 0
      housesLeft = Math.max(0, housesLeft - 1)
    }
  }
  return { score, comboMax, saves, misses, housesLeft, answered }
}

export function parseDecisions(raw: unknown): Decision[] | null {
  if (!Array.isArray(raw) || raw.length > 24) return null
  const out: Decision[] = []
  const seen = new Set<number>()
  for (const item of raw) {
    if (!item || typeof item !== 'object') return null
    const rec = item as Record<string, unknown>
    const id = Number(rec.id)
    const t = Number(rec.t)
    const action = rec.action
    if (!Number.isInteger(id) || id < 0 || id > 20) return null
    if (!Number.isFinite(t)) return null
    if (action !== 'agua' && action !== 'corte' && action !== 'evacua') return null
    if (seen.has(id)) continue
    seen.add(id)
    out.push({ id, action, t: Math.max(0, Math.min(MATCH_MS, t)) })
  }
  return out
}

export function radioTitle(score: number, saves: number, housesLeft: number): { title: string } {
  if (score >= 280 && housesLeft === 3) return { title: 'Jefe del predio' }
  if (score >= 220 && saves >= 10) return { title: 'Radio caliente' }
  if (housesLeft === 3 && saves >= 8) return { title: 'Ni una casa' }
  if (score >= 160) return { title: 'Capitán de guardia' }
  if (saves >= 7) return { title: 'Oído fino' }
  if (score >= 80) return { title: 'Aprendiz de central' }
  if (score >= 1) return { title: 'Tomó el tubo' }
  return { title: 'Línea muda' }
}
