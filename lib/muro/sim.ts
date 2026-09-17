/** MURO — cortafuego en vivo. El fuego camina de a poco. Vos pintás la pared. */

export const MATCH_MS = 90_000
export const COLS = 12
export const ROWS = 16
export const SPREAD_MS = 720
export const SPARK_MS = 28_000
export const WALL_STOCK_START = 8
export const WALL_REGEN_MS = 5_200
export const WALL_STOCK_MAX = 10
export const WALL_HARD_CAP = 20

export type Cell = { c: number; r: number }

export type WallMark = { c: number; r: number; t: number }

export type MuroResult = {
  score: number
  comboMax: number
  ticks: number
  burned: number
  houseUp: boolean
}

function mulberryStep(rng: number): { rng: number; value: number } {
  let a = (rng + 0x6d2b79f5) | 0
  let t = Math.imul(a ^ (a >>> 15), 1 | a)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return { rng: a, value: ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

export function houseCell(seed: number): Cell {
  let rng = (seed ^ 0x9e3779b9) | 0
  const rand = () => {
    const s = mulberryStep(rng)
    rng = s.rng
    return s.value
  }
  return { c: 2 + Math.floor(rand() * (COLS - 4)), r: ROWS - 3 }
}

export function igniteCell(seed: number, which = 0): Cell {
  let rng = (seed + which * 97) | 0
  const rand = () => {
    const s = mulberryStep(rng)
    rng = s.rng
    return s.value
  }
  return { c: 1 + Math.floor(rand() * (COLS - 2)), r: which === 0 ? 1 : 2 + Math.floor(rand() * 3) }
}

export function keyOf(c: number, r: number): string {
  return `${c},${r}`
}

export type MuroLive = {
  fire: Set<string>
  rng: number
  ticks: number
  burned: number
  houseUp: boolean
  sparks: number
}

function wallSet(walls: WallMark[], t: number): Set<string> {
  const wallAt = new Map<string, number>()
  for (const w of walls) {
    if (w.c < 0 || w.r < 0 || w.c >= COLS || w.r >= ROWS) continue
    const k = keyOf(w.c, w.r)
    const prev = wallAt.get(k)
    if (prev == null || w.t < prev) wallAt.set(k, Math.max(0, Math.min(MATCH_MS, w.t)))
  }
  const out = new Set<string>()
  for (const [k, at] of wallAt) {
    if (at <= t) out.add(k)
  }
  return out
}

function frontier(fire: Set<string>, wall: Set<string>): string[] {
  const next: string[] = []
  const seen = new Set<string>()
  for (const k of fire) {
    const [cs, rs] = k.split(',')
    const c = Number(cs)
    const r = Number(rs)
    for (const [nc, nr] of [
      [c + 1, r],
      [c - 1, r],
      [c, r + 1],
      [c, r - 1],
    ] as const) {
      if (nc < 0 || nr < 0 || nc >= COLS || nr >= ROWS) continue
      const nk = keyOf(nc, nr)
      if (fire.has(nk) || wall.has(nk) || seen.has(nk)) continue
      seen.add(nk)
      next.push(nk)
    }
  }
  return next
}

export function createMuroLive(seed: number): MuroLive {
  const start = igniteCell(seed, 0)
  return {
    fire: new Set([keyOf(start.c, start.r)]),
    rng: seed | 0,
    ticks: 0,
    burned: 1,
    houseUp: true,
    sparks: 1,
  }
}

/** Un tick = 1 celda nueva (a veces 2 tarde). El blob crece ~90s, no 6s. */
export function tickMuro(live: MuroLive, seed: number, walls: WallMark[], t: number): MuroLive {
  const house = houseCell(seed)
  const wall = wallSet(walls, t)
  let rng = live.rng
  const rand = () => {
    const s = mulberryStep(rng)
    rng = s.rng
    return s.value
  }
  const fire = new Set(live.fire)
  let burned = live.burned
  let houseUp = live.houseUp
  let sparks = live.sparks

  const ignite = (nk: string) => {
    if (fire.has(nk) || wall.has(nk)) return
    fire.add(nk)
    burned += 1
    if (nk === keyOf(house.c, house.r)) houseUp = false
  }

  if (sparks < 3 && t >= SPARK_MS * sparks) {
    const extra = igniteCell(seed, sparks)
    ignite(keyOf(extra.c, extra.r))
    sparks += 1
  }

  const expands = t > 60_000 ? 2 : 1
  for (let n = 0; n < expands; n++) {
    const edge = frontier(fire, wall)
    if (!edge.length) break
    ignite(edge[Math.floor(rand() * edge.length)]!)
  }

  return { fire, rng, ticks: live.ticks + 1, burned, houseUp, sparks }
}

export function stockAt(t: number): number {
  return Math.min(WALL_STOCK_MAX, WALL_STOCK_START + Math.floor(Math.max(0, t) / WALL_REGEN_MS))
}

export function legalWalls(walls: WallMark[]): WallMark[] {
  const sorted = [...walls].sort((a, b) => a.t - b.t)
  const kept: WallMark[] = []
  const seen = new Set<string>()
  for (const w of sorted) {
    if (kept.length >= WALL_HARD_CAP) break
    if (w.c < 0 || w.r < 0 || w.c >= COLS || w.r >= ROWS) continue
    const k = keyOf(w.c, w.r)
    if (seen.has(k)) continue
    if (kept.length >= stockAt(w.t)) continue
    seen.add(k)
    kept.push(w)
  }
  return kept
}

export function simulateRun(seed: number, walls: WallMark[]): MuroResult {
  const legal = legalWalls(walls)
  let live = createMuroLive(seed)
  let t = 0
  while (t < MATCH_MS && live.houseUp) {
    t += SPREAD_MS
    live = tickMuro(live, seed, legal, t)
  }
  const saved = COLS * ROWS - live.burned
  const survived = live.houseUp ? MATCH_MS : t
  const spare = Math.max(0, stockAt(survived) - legal.length)
  const score = Math.max(0, Math.round(survived / 80 + saved * 2 + (live.houseUp ? 80 : 0) + spare * 4))
  return {
    score,
    comboMax: live.houseUp ? 8 : Math.max(1, Math.floor(survived / 12000)),
    ticks: live.ticks,
    burned: live.burned,
    houseUp: live.houseUp,
  }
}

export function parseWalls(raw: unknown): WallMark[] | null {
  if (!Array.isArray(raw) || raw.length > 400) return null
  const out: WallMark[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') return null
    const rec = item as Record<string, unknown>
    const c = Number(rec.c)
    const r = Number(rec.r)
    const t = Number(rec.t)
    if (!Number.isInteger(c) || !Number.isInteger(r) || !Number.isFinite(t)) return null
    out.push({ c, r, t })
  }
  return legalWalls(out)
}

export function muroTitle(score: number, houseUp: boolean): { title: string } {
  if (houseUp && score >= 420) return { title: 'Muro de tajibo' }
  if (houseUp && score >= 320) return { title: 'Cortafuego vivo' }
  if (houseUp) return { title: 'La casa sigue' }
  if (score >= 180) return { title: 'Aguantó el lote' }
  if (score >= 80) return { title: 'Pintó tarde' }
  return { title: 'Se lo comió' }
}
