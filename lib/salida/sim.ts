/** SALIDA — tres sendas. El humo corre. Cambiá de carril. */

export const MATCH_MS = 90_000
export const LANES = 3
export const STEP_MS = 280

export type LaneEvent = {
  t: number
  lane: number
  kind: 'fuego' | 'tronco' | 'gente'
}

export type LaneMark = { t: number; lane: number }

export type SalidaResult = {
  score: number
  comboMax: number
  rescued: number
  hits: number
  dist: number
}

function mulberryStep(rng: number): { rng: number; value: number } {
  let a = (rng + 0x6d2b79f5) | 0
  let t = Math.imul(a ^ (a >>> 15), 1 | a)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return { rng: a, value: ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

export function buildTrack(seed: number): LaneEvent[] {
  let rng = seed | 0
  const rand = () => {
    const s = mulberryStep(rng)
    rng = s.rng
    return s.value
  }
  const events: LaneEvent[] = []
  let t = 900
  while (t < MATCH_MS - 800) {
    const gap = 520 + Math.floor(rand() * 420) - Math.min(280, t / 80)
    t += Math.max(380, gap)
    const lane = Math.floor(rand() * LANES)
    const roll = rand()
    const kind: LaneEvent['kind'] = roll > 0.78 ? 'gente' : roll > 0.42 ? 'fuego' : 'tronco'
    events.push({ t, lane, kind })
    if (rand() > 0.7 && t < MATCH_MS - 1200) {
      const other = (lane + 1 + Math.floor(rand() * 2)) % LANES
      events.push({ t: t + 80, lane: other, kind: rand() > 0.5 ? 'fuego' : 'tronco' })
    }
  }
  return events.sort((a, b) => a.t - b.t)
}

export function laneAt(marks: LaneMark[], t: number): number {
  let lane = 1
  const path = [...marks].sort((a, b) => a.t - b.t)
  for (const m of path) {
    if (m.t <= t) lane = Math.max(0, Math.min(2, m.lane))
    else break
  }
  return lane
}

export type LiveScore = {
  score: number
  combo: number
  comboMax: number
  rescued: number
  hits: number
}

export function emptyScore(): LiveScore {
  return { score: 0, combo: 0, comboMax: 0, rescued: 0, hits: 0 }
}

export function applyEvent(ev: LaneEvent, lane: number, state: LiveScore): 'save' | 'hit' | 'dodge' | 'miss-gente' {
  if (ev.kind === 'gente') {
    if (lane === ev.lane) {
      state.combo += 1
      state.comboMax = Math.max(state.comboMax, state.combo)
      state.rescued += 1
      state.score += 18 + state.combo * 4
      return 'save'
    }
    return 'miss-gente'
  }
  if (lane === ev.lane) {
    state.hits += 1
    state.combo = 0
    state.score = Math.max(0, state.score - 40)
    return 'hit'
  }
  state.combo += 1
  state.comboMax = Math.max(state.comboMax, state.combo)
  state.score += 6 + Math.min(state.combo, 8)
  return 'dodge'
}

export function simulateRun(seed: number, marks: LaneMark[]): SalidaResult {
  const track = buildTrack(seed)
  const state = emptyScore()
  for (const ev of track) {
    applyEvent(ev, laneAt(marks, ev.t), state)
  }
  const dist = Math.round(MATCH_MS / 90)
  state.score += dist
  return { score: state.score, comboMax: state.comboMax, rescued: state.rescued, hits: state.hits, dist }
}

export function parseMarks(raw: unknown): LaneMark[] | null {
  if (!Array.isArray(raw) || raw.length > 400) return null
  const out: LaneMark[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') return null
    const rec = item as Record<string, unknown>
    const t = Number(rec.t)
    const lane = Number(rec.lane)
    if (!Number.isFinite(t) || !Number.isInteger(lane)) return null
    out.push({ t: Math.max(0, Math.min(MATCH_MS, t)), lane: Math.max(0, Math.min(2, lane)) })
  }
  return out
}

export function salidaTitle(score: number, rescued: number, hits: number): { title: string } {
  if (hits === 0 && rescued >= 8) return { title: 'Chasqui de oro' }
  if (rescued >= 10 && hits <= 3) return { title: 'Sacó al pueblo' }
  if (score >= 260 && hits <= 6) return { title: 'Corrió el humo' }
  if (rescued >= 4 && hits <= 10) return { title: 'Guía del camino' }
  if (score >= 80) return { title: 'Salió con tos' }
  return { title: 'Lo cubrió el humo' }
}
