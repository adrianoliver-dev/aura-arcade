/** Simulación determinista de AURA: ANTES DEL HUMO. Cliente y server usan el mismo código. */

export const TICK_MS = 16
export const MATCH_MS = 45_000
export const COLS = 16
export const ROWS = 22
export const HA_PER_CELL = 1
export const MAX_STROKE_POINTS = 96
export const FREEZE_MS = 43_000

const WINDOWS: { appearMs: number; commitMs: number; radius: number; spreadMs: number }[] = [
  { appearMs: 0, commitMs: 8_000, radius: 2, spreadMs: 1_700 },
  { appearMs: 2_800, commitMs: 11_500, radius: 2, spreadMs: 1_500 },
  { appearMs: 6_500, commitMs: 16_000, radius: 3, spreadMs: 1_350 },
  { appearMs: 11_000, commitMs: 21_500, radius: 3, spreadMs: 1_200 },
  { appearMs: 17_000, commitMs: 28_000, radius: 3, spreadMs: 1_100 },
  { appearMs: 24_000, commitMs: 35_500, radius: 3, spreadMs: 1_000 },
  { appearMs: 31_500, commitMs: 42_000, radius: 4, spreadMs: 850 },
]

export const FOCO_N = WINDOWS.length
export const MAX_STROKES = FOCO_N

export const TERRAIN = {
  path: 0,
  field: 1,
  monte: 2,
  water: 3,
  shed: 4,
  house: 5,
} as const

export type Terrain = (typeof TERRAIN)[keyof typeof TERRAIN]

export type Cell = { c: number; r: number }

export type Stroke = {
  incident: number
  points: { x: number; y: number }[]
  t0: number
  t1: number
}

export type Incident = {
  id: number
  appearMs: number
  commitMs: number
  focus: Cell
  node: Cell
  wind: Cell
  radius: number
  spreadMs: number
}

export type World = {
  seed: number
  cols: number
  rows: number
  terrain: Uint8Array
  node: Cell
  incidents: Incident[]
  house: Cell
  shed: Cell
}

export type IncidentResult = {
  id: number
  saved: number
  possible: number
  efficiency: number
  arrived: boolean
  cells: Cell[]
}

export function strokeOnRoad(world: World, stroke: Stroke): boolean {
  const path = rasterizeStroke(world, stroke.points)
  if (path.length < 3) return true
  let road = 0
  for (let i = 1; i < path.length; i++) {
    const cell = path[i]!
    if ((world.terrain[idx(cell.c, cell.r)] as Terrain) === TERRAIN.path) road += 1
  }
  return road / (path.length - 1) >= 0.45
}

export type SimResult = {
  hectares: number
  efficiency: number
  remainingMs: number
  savedByIncident: IncidentResult[]
  rankScore: number
}

function mulberryStep(rng: number): { rng: number; value: number } {
  let a = (rng + 0x6d2b79f5) | 0
  let t = Math.imul(a ^ (a >>> 15), 1 | a)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return { rng: a, value: ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

export function idx(c: number, r: number): number {
  return r * COLS + c
}

function inBounds(c: number, r: number): boolean {
  return c >= 0 && r >= 0 && c < COLS && r < ROWS
}

export function costOf(t: Terrain): number {
  if (t === TERRAIN.water) return 99
  if (t === TERRAIN.path) return 1
  if (t === TERRAIN.field) return 1.55
  if (t === TERRAIN.monte) return 2.35
  return 2.7
}

export function walkable(t: Terrain): boolean {
  return t !== TERRAIN.water
}

function stamp(grid: Uint8Array, c: number, r: number, t: Terrain, rad = 0): void {
  for (let dr = -rad; dr <= rad; dr++) {
    for (let dc = -rad; dc <= rad; dc++) {
      const cc = c + dc
      const rr = r + dr
      if (!inBounds(cc, rr)) continue
      if (t === TERRAIN.water || t === TERRAIN.monte || t === TERRAIN.field) {
        grid[idx(cc, rr)] = t
      } else if (dc === 0 && dr === 0) {
        grid[idx(cc, rr)] = t
      }
    }
  }
}

export function createWorld(seed: number): World {
  let rng = seed | 0
  const rand = () => {
    const step = mulberryStep(rng)
    rng = step.rng
    return step.value
  }
  const irand = (n: number) => Math.floor(rand() * n)

  const terrain = new Uint8Array(COLS * ROWS)
  terrain.fill(TERRAIN.field)

  const roadC = 3 + irand(4)
  const roadR = 8 + irand(6)
  for (let r = 0; r < ROWS; r++) terrain[idx(roadC, r)] = TERRAIN.path
  for (let c = 0; c < COLS; c++) terrain[idx(c, roadR)] = TERRAIN.path
  if (rand() > 0.35) {
    const c2 = Math.min(COLS - 2, roadC + 4 + irand(3))
    for (let r = Math.max(1, roadR - 6); r < Math.min(ROWS - 1, roadR + 7); r++) {
      terrain[idx(c2, r)] = TERRAIN.path
    }
  }

  for (let i = 0; i < 4; i++) {
    stamp(terrain, 1 + irand(COLS - 2), 1 + irand(ROWS - 2), TERRAIN.monte, 1 + irand(2))
  }

  const pondC = 2 + irand(COLS - 4)
  const pondR = 2 + irand(ROWS - 4)
  stamp(terrain, pondC, pondR, TERRAIN.water, 1)
  terrain[idx(Math.min(COLS - 1, pondC + 1), pondR)] = TERRAIN.water

  const house: Cell = { c: Math.min(COLS - 2, roadC + 1), r: Math.max(1, roadR - 2) }
  const shed: Cell = { c: Math.max(1, roadC - 1), r: Math.min(ROWS - 2, roadR + 3) }
  terrain[idx(house.c, house.r)] = TERRAIN.house
  terrain[idx(shed.c, shed.r)] = TERRAIN.shed

  const node: Cell = { c: roadC, r: roadR }

  const used = new Set<string>([`${node.c}:${node.r}`])
  const incidents: Incident[] = WINDOWS.map((win, id) => {
    let focus: Cell = { c: node.c, r: node.r }
    for (let tries = 0; tries < 28; tries++) {
      const c = 1 + irand(COLS - 2)
      const r = 1 + irand(ROWS - 2)
      const t = terrain[idx(c, r)]!
      const far = Math.abs(c - node.c) + Math.abs(r - node.r) >= 4 + (id % 3)
      const key = `${c}:${r}`
      if (walkable(t as Terrain) && t !== TERRAIN.path && far && !used.has(key)) {
        focus = { c, r }
        used.add(key)
        break
      }
    }
    const wind: Cell = {
      c: rand() > 0.5 ? 1 : -1,
      r: rand() > 0.45 ? 1 : 0,
    }
    return { id, ...win, focus, node, wind }
  })

  return { seed: seed | 0, cols: COLS, rows: ROWS, terrain, node, incidents, house, shed }
}

export function cellAtNorm(x: number, y: number): Cell {
  const c = Math.max(0, Math.min(COLS - 1, Math.floor(x * COLS)))
  const r = Math.max(0, Math.min(ROWS - 1, Math.floor(y * ROWS)))
  return { c, r }
}

export function normOfCell(cell: Cell): { x: number; y: number } {
  return { x: (cell.c + 0.5) / COLS, y: (cell.r + 0.5) / ROWS }
}

function neighbors(c: number, r: number): Cell[] {
  const out: Cell[] = []
  if (c > 0) out.push({ c: c - 1, r })
  if (c < COLS - 1) out.push({ c: c + 1, r })
  if (r > 0) out.push({ c, r: r - 1 })
  if (r < ROWS - 1) out.push({ c, r: r + 1 })
  return out
}

function snapWalkable(world: World, cell: Cell): Cell | null {
  const t = world.terrain[idx(cell.c, cell.r)] as Terrain
  if (walkable(t)) return cell
  for (const n of neighbors(cell.c, cell.r)) {
    if (walkable(world.terrain[idx(n.c, n.r)] as Terrain)) return n
  }
  return null
}

function lineCells(a: Cell, b: Cell): Cell[] {
  const cells: Cell[] = []
  let x0 = a.c
  let y0 = a.r
  const x1 = b.c
  const y1 = b.r
  const dx = Math.abs(x1 - x0)
  const dy = Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err = dx - dy
  while (true) {
    cells.push({ c: x0, r: y0 })
    if (x0 === x1 && y0 === y1) break
    const e2 = 2 * err
    if (e2 > -dy) {
      err -= dy
      x0 += sx
    }
    if (e2 < dx) {
      err += dx
      y0 += sy
    }
  }
  return cells
}

export function rasterizeStroke(world: World, points: { x: number; y: number }[]): Cell[] {
  const cells: Cell[] = []
  const push = (cell: Cell) => {
    const last = cells[cells.length - 1]
    if (last && last.c === cell.c && last.r === cell.r) return
    cells.push(cell)
  }
  let prev: Cell | null = null
  for (const p of points) {
    const raw = cellAtNorm(p.x, p.y)
    const snapped = snapWalkable(world, raw)
    if (!snapped) continue
    if (prev) {
      for (const step of lineCells(prev, snapped)) {
        const walk = snapWalkable(world, step)
        if (walk) push(walk)
      }
    } else {
      push(snapped)
    }
    prev = snapped
  }
  return cells.slice(0, 80)
}

function distManhattan(a: Cell, b: Cell): number {
  return Math.abs(a.c - b.c) + Math.abs(a.r - b.r)
}

function distChebyshev(a: Cell, b: Cell): number {
  return Math.max(Math.abs(a.c - b.c), Math.abs(a.r - b.r))
}

export function astar(world: World, start: Cell, goal: Cell): Cell[] | null {
  const key = (c: Cell) => `${c.c}:${c.r}`
  const open: Cell[] = [start]
  const came = new Map<string, Cell>()
  const g = new Map<string, number>([[key(start), 0]])
  const f = new Map<string, number>([[key(start), distManhattan(start, goal)]])

  while (open.length) {
    open.sort((a, b) => (f.get(key(a)) ?? 1e9) - (f.get(key(b)) ?? 1e9))
    const cur = open.shift()!
    if (cur.c === goal.c && cur.r === goal.r) {
      const path = [cur]
      let k = key(cur)
      while (came.has(k)) {
        const prev = came.get(k)!
        path.push(prev)
        k = key(prev)
      }
      path.reverse()
      return path
    }
    for (const n of neighbors(cur.c, cur.r)) {
      const ter = world.terrain[idx(n.c, n.r)] as Terrain
      if (!walkable(ter)) continue
      const tentative = (g.get(key(cur)) ?? 1e9) + costOf(ter)
      const nk = key(n)
      if (tentative < (g.get(nk) ?? 1e9)) {
        came.set(nk, cur)
        g.set(nk, tentative)
        f.set(nk, tentative + distManhattan(n, goal))
        if (!open.some((o) => o.c === n.c && o.r === n.r)) open.push(n)
      }
    }
  }
  return null
}

export function pathCost(world: World, path: Cell[]): number {
  let sum = 0
  for (let i = 1; i < path.length; i++) {
    const cell = path[i]!
    sum += costOf(world.terrain[idx(cell.c, cell.r)] as Terrain)
  }
  return sum
}

export function assetCells(world: World, incident: Incident): Cell[] {
  const out: Cell[] = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (distChebyshev({ c, r }, incident.focus) > incident.radius) continue
      const t = world.terrain[idx(c, r)] as Terrain
      if (t === TERRAIN.water) continue
      out.push({ c, r })
    }
  }
  return out
}

export function fireTimeMs(incident: Incident, cell: Cell): number {
  const base = distChebyshev(incident.focus, cell)
  const align =
    incident.wind.c * Math.sign(cell.c - incident.focus.c) + incident.wind.r * Math.sign(cell.r - incident.focus.r)
  const wind = 1 - 0.12 * Math.max(-1, Math.min(1, align))
  return incident.appearMs + base * incident.spreadMs * wind
}

const MS_PER_COST = 70

export function resolveIncident(
  world: World,
  incident: Incident,
  stroke: Stroke | undefined,
  startFrom: Cell = incident.node,
): IncidentResult {
  const possibleCells = assetCells(world, incident)
  const possible = possibleCells.length
  const empty = { id: incident.id, saved: 0, possible, efficiency: 0, arrived: false, cells: [] as Cell[] }
  if (!stroke || stroke.points.length < 2) {
    return empty
  }

  const path = rasterizeStroke(world, stroke.points)
  if (path.length < 2) {
    return empty
  }

  const start = path[0]!
  const fromHq = distManhattan(start, incident.node) <= 3
  const fromBrigade = distManhattan(start, startFrom) <= 3
  if (!fromHq && !fromBrigade) {
    return empty
  }

  const origin = fromBrigade ? startFrom : incident.node
  const prefix = astar(world, origin, start) ?? [origin]
  const full = [...prefix, ...path.slice(1)]
  const travel = pathCost(world, full) * MS_PER_COST
  const t1 = Math.max(incident.appearMs, Math.min(MATCH_MS, stroke.t1))
  const arrival = t1 + travel
  const arrived = distManhattan(path[path.length - 1]!, incident.focus) <= 2

  const cells: Cell[] = []
  if (arrived) {
    for (const cell of possibleCells) {
      if (arrival < fireTimeMs(incident, cell)) cells.push(cell)
    }
  }

  const ideal = astar(world, origin, incident.focus)
  const idealCost = ideal ? pathCost(world, ideal) : pathCost(world, path)
  const playerCost = Math.max(pathCost(world, full), 0.01)
  const efficiency = Math.max(0, Math.min(1, idealCost / playerCost))

  return { id: incident.id, saved: cells.length, possible, efficiency, arrived, cells }
}

export function simulateRun(seed: number, strokes: Stroke[]): SimResult {
  const world = createWorld(seed)
  const ordered = [...strokes]
    .filter((s) => s.incident >= 0 && s.incident < FOCO_N)
    .sort((a, b) => a.t1 - b.t1 || a.t0 - b.t0)
  const seen = new Set<number>()
  const byId: IncidentResult[] = world.incidents.map((inc) => resolveIncident(world, inc, undefined))
  let brigade = world.node
  let combo = 0
  let hectares = 0
  for (const stroke of ordered) {
    if (seen.has(stroke.incident)) continue
    const inc = world.incidents[stroke.incident]
    if (!inc) continue
    seen.add(stroke.incident)
    const resolved = resolveIncident(world, inc, stroke, brigade)
    let saved = resolved.saved
    if (resolved.arrived && resolved.saved > 0) {
      combo += 1
      if (combo > 1) saved += Math.floor(resolved.saved * 0.18 * Math.min(combo - 1, 4))
      brigade = inc.focus
    } else {
      combo = 0
    }
    byId[inc.id] = { ...resolved, saved }
    hectares += saved * HA_PER_CELL
  }
  const efficiency = Math.round((byId.reduce((n, r) => n + r.efficiency, 0) / FOCO_N) * 100)
  const lastCommit = Math.max(0, ...strokes.map((s) => s.t1))
  const remainingMs = Math.max(0, MATCH_MS - Math.min(MATCH_MS, lastCommit || FREEZE_MS))
  const rankScore = hectares * 100 + efficiency + Math.round(remainingMs / 400)
  return {
    hectares,
    efficiency,
    remainingMs,
    savedByIncident: byId,
    rankScore,
  }
}

export function optimalStrokes(seed: number): Stroke[] {
  const world = createWorld(seed)
  return world.incidents.map((inc) => {
    const path = astar(world, inc.node, inc.focus) ?? [inc.node, inc.focus]
    return {
      incident: inc.id,
      points: path.map(normOfCell),
      t0: inc.appearMs + 400,
      t1: inc.appearMs + 900,
    }
  })
}

export function encodeShareSeed(seed: number): string {
  return (seed >>> 0).toString(36).toUpperCase()
}

export function parseShareSeed(raw: string | null | undefined): number | null {
  if (!raw) return null
  const s = raw.trim().toUpperCase()
  if (!/^[1-9A-Z][0-9A-Z]*$/.test(s)) return null
  const n = Number.parseInt(s, 36)
  if (!Number.isInteger(n) || n <= 0 || n > 0x7fffffff) return null
  if (encodeShareSeed(n) !== s) return null
  return n | 0
}

export function incidentAt(t: number, world: World): Incident | null {
  const live = liveIncidents(t, world)
  if (!live.length) return null
  return live.reduce((a, b) => (a.commitMs - t <= b.commitMs - t ? a : b))
}

export function liveIncidents(t: number, world: World, done?: Iterable<number>): Incident[] {
  const closed = done ? new Set(done) : null
  return world.incidents.filter((inc) => {
    if (closed?.has(inc.id)) return false
    return t >= inc.appearMs && t < inc.commitMs
  })
}

export function nearestIncident(
  pt: { x: number; y: number },
  incidents: Incident[],
): Incident | null {
  let best: Incident | null = null
  let bestD = Infinity
  for (const inc of incidents) {
    const focus = normOfCell(inc.focus)
    const dx = pt.x - focus.x
    const dy = pt.y - focus.y
    const d = dx * dx + dy * dy
    if (d < bestD) {
      bestD = d
      best = inc
    }
  }
  return best
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n))
}

export function parseStrokes(raw: unknown): Stroke[] | null {
  if (!Array.isArray(raw) || raw.length > MAX_STROKES) return null
  const out: Stroke[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') return null
    const rec = item as Record<string, unknown>
    const incident = Number(rec.incident)
    if (!Number.isInteger(incident) || incident < 0 || incident >= FOCO_N) return null
    if (!Array.isArray(rec.points) || rec.points.length > MAX_STROKE_POINTS) return null
    const points: { x: number; y: number }[] = []
    for (const point of rec.points) {
      if (!point || typeof point !== 'object') return null
      const xy = point as { x?: unknown; y?: unknown }
      const x = Number(xy.x)
      const y = Number(xy.y)
      if (!Number.isFinite(x) || !Number.isFinite(y)) return null
      points.push({ x: clamp01(x), y: clamp01(y) })
    }
    const t0 = Number(rec.t0)
    const t1 = Number(rec.t1)
    if (!Number.isFinite(t0) || !Number.isFinite(t1)) return null
    out.push({
      incident,
      points,
      t0: Math.max(0, Math.min(MATCH_MS, t0)),
      t1: Math.max(0, Math.min(MATCH_MS, t1)),
    })
  }
  return out
}
