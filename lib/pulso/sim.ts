/** Simulación determinista de AURA PULSO. Cliente y server usan el mismo código. */

export const TICK_MS = 16
export const MATCH_MS = 45_000
export const CX = 0.5
export const CY = 0.5
export const ISLAND_R = 0.078
export const RING_MIN = 0.096
export const RING_MAX = 0.452
export const RING_THICK = 0.036
export const PERFECT_BAND = 0.016
export const EMBER_R = 0.02
export const BREACH_PENALTY = 250
export const RUSH_START_MS = 36_000
export const MAX_EMBERS = 12

export type PulseKind = 'PERFECT' | 'DOBLE' | 'CASI' | 'MISS' | 'BRECHA'

export type PulseEvent = {
  t: number
  kind: PulseKind
  n: number
  points: number
  streak: number
}

export type Ember = {
  x: number
  y: number
  speed: number
  alive: boolean
}

export type SimState = {
  t: number
  rng: number
  score: number
  streak: number
  comboMax: number
  kills: number
  ringR: number
  embers: Ember[]
  nextSpawn: number
  finished: boolean
  events: PulseEvent[]
}

function mulberryStep(rng: number): { rng: number; value: number } {
  let a = (rng + 0x6d2b79f5) | 0
  let t = Math.imul(a ^ (a >>> 15), 1 | a)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return { rng: a, value: ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

function rand(state: SimState): number {
  const step = mulberryStep(state.rng)
  state.rng = step.rng
  return step.value
}

export function comboMultiplier(streak: number): number {
  if (streak <= 0) return 1
  return Math.min(1 + 0.2 * streak, 4)
}

export function pulsePoints(n: number, quality: number, streak: number): number {
  const combo = comboMultiplier(streak)
  const groupBonus = 75 * n * (n - 1) / 2
  return Math.round(100 * n * quality * combo + groupBonus)
}

export function createSim(seed: number): SimState {
  const state: SimState = {
    t: 0,
    rng: seed | 0,
    score: 0,
    streak: 0,
    comboMax: 0,
    kills: 0,
    ringR: RING_MIN,
    embers: [],
    nextSpawn: 0,
    finished: false,
    events: [],
  }
  state.nextSpawn = 360 + Math.floor(rand(state) * 120)
  return state
}

function rush(state: SimState): boolean {
  return state.t >= RUSH_START_MS
}

function spawnInterval(state: SimState): number {
  if (rush(state)) return 220
  const u = Math.min(1, state.t / RUSH_START_MS)
  return 760 - u * 330
}

function emberSpeed(state: SimState): number {
  const u = Math.min(1, state.t / MATCH_MS)
  const base = 0.000052 + u * 0.000028
  return rush(state) ? base * 1.35 : base
}

function ringSpeed(state: SimState): number {
  const base = (RING_MAX - RING_MIN) / 1080
  return rush(state) ? base * 1.32 : base
}

function spawnEmber(state: SimState): void {
  if (state.embers.length > 36) {
    state.embers = state.embers.filter((e) => e.alive)
  }
  if (state.embers.filter((e) => e.alive).length >= MAX_EMBERS) return
  const ang = rand(state) * Math.PI * 2
  const r = 0.535
  state.embers.push({
    x: CX + Math.cos(ang) * r,
    y: CY + Math.sin(ang) * r,
    speed: emberSpeed(state),
    alive: true,
  })
}

export function distToCenter(x: number, y: number): number {
  return Math.hypot(x - CX, y - CY)
}

export function emberInBand(ember: Ember, ringR: number, band: number): boolean {
  if (!ember.alive) return false
  const d = distToCenter(ember.x, ember.y)
  return Math.abs(d - ringR) <= band + EMBER_R
}

export function countHitsAtRing(state: SimState): number {
  return state.embers.filter((e) => emberInBand(e, state.ringR, RING_THICK / 2)).length
}

function pushEvent(state: SimState, event: Omit<PulseEvent, 't' | 'streak'>): PulseEvent {
  const full: PulseEvent = { ...event, t: state.t, streak: state.streak }
  state.events.push(full)
  return full
}

export function tapSim(state: SimState): PulseEvent {
  if (state.finished) {
    return pushEvent(state, { kind: 'MISS', n: 0, points: 0 })
  }

  const ringR = state.ringR
  const hits = state.embers.filter((e) => emberInBand(e, ringR, RING_THICK / 2))
  const n = hits.length
  state.ringR = RING_MIN

  if (n === 0) {
    state.streak = 0
    return pushEvent(state, { kind: 'MISS', n: 0, points: 0 })
  }

  for (const ember of hits) ember.alive = false
  state.kills += n

  const quality = hits.every((e) => emberInBand(e, ringR, PERFECT_BAND)) ? 1.5 : 1.0
  state.streak += 1
  if (state.streak > state.comboMax) state.comboMax = state.streak
  const points = pulsePoints(n, quality, state.streak)
  state.score += points

  const kind: PulseKind = n >= 2 ? 'DOBLE' : quality >= 1.5 ? 'PERFECT' : 'CASI'
  return pushEvent(state, { kind, n, points })
}

export function stepSim(state: SimState, dtMs: number): PulseEvent[] {
  const born: PulseEvent[] = []
  if (state.finished || dtMs <= 0) return born

  const steps = dtMs
  state.t += steps
  if (state.t >= MATCH_MS) {
    state.t = MATCH_MS
    state.finished = true
  }

  for (const ember of state.embers) {
    if (!ember.alive) continue
    const d = distToCenter(ember.x, ember.y)
    if (d <= ISLAND_R) {
      ember.alive = false
      state.streak = 0
      state.score = Math.max(0, state.score - BREACH_PENALTY)
      born.push(pushEvent(state, { kind: 'BRECHA', n: 0, points: -BREACH_PENALTY }))
      continue
    }
    const nx = (CX - ember.x) / d
    const ny = (CY - ember.y) / d
    ember.x += nx * ember.speed * steps
    ember.y += ny * ember.speed * steps
  }

  state.ringR += ringSpeed(state) * steps
  if (state.ringR > RING_MAX) state.ringR = RING_MIN

  while (!state.finished && state.t >= state.nextSpawn) {
    spawnEmber(state)
    state.nextSpawn += spawnInterval(state)
  }

  if (state.finished) {
    state.embers.forEach((e) => {
      e.alive = false
    })
  }

  return born
}

export type SimResult = {
  score: number
  comboMax: number
  kills: number
  events: PulseEvent[]
}

/**
 * Replay server-side. `tapTimesMs` son tiempos desde t=0 (inicio del reloj).
 * Se cuantizan al tick para que cliente y server coincidan.
 */
export function simulateRun(seed: number, tapTimesMs: number[]): SimResult {
  const state = createSim(seed)
  const taps = tapTimesMs
    .map((t) => Math.max(0, Math.min(MATCH_MS, Math.round(t))))
    .sort((a, b) => a - b)
  let i = 0

  while (!state.finished) {
    const nextTick = state.t + TICK_MS
    while (i < taps.length && taps[i]! <= nextTick) {
      tapSim(state)
      i += 1
    }
    stepSim(state, TICK_MS)
  }

  while (i < taps.length) {
    tapSim(state)
    i += 1
  }

  return { score: state.score, comboMax: state.comboMax, kills: state.kills, events: state.events }
}

export function parseTaps(raw: unknown): number[] | null {
  if (!Array.isArray(raw) || raw.length > 240) return null
  const out: number[] = []
  for (const item of raw) {
    const n = Number(item)
    if (!Number.isFinite(n)) return null
    out.push(n)
  }
  return out
}

export function shouldAutoTap(state: SimState): boolean {
  return state.embers.some((e) => emberInBand(e, state.ringR, PERFECT_BAND))
}

export function countKind(events: PulseEvent[], kind: PulseKind): number {
  return events.filter((e) => e.kind === kind).length
}

export function waveAt(t: number): { id: 'levante' | 'norte' | 'chaco' | 'noche'; label: string } {
  if (t >= RUSH_START_MS) return { id: 'noche', label: 'Noche de brasa' }
  if (t >= 48_000) return { id: 'chaco', label: 'Viento del chaco' }
  if (t >= 22_000) return { id: 'norte', label: 'Frente norte' }
  return { id: 'levante', label: 'Levante' }
}
