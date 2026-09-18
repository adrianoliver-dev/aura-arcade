/**
 * Fuente de verdad de AURA: ANTES DEL HUMO.
 * Cliente y server llaman las mismas funciones. No duplicar fórmulas.
 */

export const COLS = 12
export const ROWS = 16

// El foco inicial tiene que responder desde el primer fotograma. Antes había
// cuatro segundos en los que el mapa se veía jugable, pero ignoraba el pulgar.
export const READ_MS = 0
export const TELEGRAPH_MS = READ_MS
export const GUIDE_MS = 0
export const CASA_END_MS = 14_000
export const WATER_START_MS = 15_000
export const WATER_END_MS = 27_000
export const CORRAL_START_MS = 28_000
export const RESOLUTION_MS = 7_000
export const MATCH_MS = 40_000
export const FREEZE_MS = MATCH_MS
export const TICK_MS = 16
export const FOCO_N = 3
export const TRAVEL_MS_PER_CELL = 180
// Esto es un juego de reacción, no una prueba de precisión milimétrica. Los
// aros visibles son grandes y el imán debe sentirse igual de generoso con un
// pulgar apurado, tanto en móvil como en la pantalla del stand.
export const SNAP_START_CELLS = 3.25
export const SNAP_END_CELLS = 2.75
export const REMATCH_KEEP_SEED = 3
export const TARGET_MIN_PX = 48
export const TZ = 'America/La_Paz'

export const TERRAIN = {
  path: 0,
  field: 1,
  monte: 2,
  water: 3,
  shed: 4,
  house: 5,
} as const

export type Terrain = (typeof TERRAIN)[keyof typeof TERRAIN]
export type AssetKind = 'house' | 'water' | 'corral'
export type CorridorId = 'fast' | 'safe' | 'cut'
export type EtaBand = 'green' | 'amber' | 'red'
export type Medal = 'ALERTA' | 'RUTA CLARA' | 'OJO DE FUEGO'

export type Cell = { c: number; r: number }
export type Point = { x: number; y: number }
export type Wind = { c: number; r: number }

export type Incident = {
  id: number
  kind: AssetKind
  appearMs: number
  commitMs: number
  focus: Cell
  node: Cell
  wind: Wind
  radius: number
  spreadMs: number
}

export type Stroke = {
  incident: number
  points: Point[]
  t0: number
  t1: number
}

export type World = {
  seed: number
  cols: number
  rows: number
  terrain: Uint8Array
  node: Cell
  wind: Wind
  incidents: Incident[]
}

export type IncidentResult = {
  id: number
  arrived: boolean
  saved: number
  cells: Cell[]
  late: boolean
  eta: EtaBand
  quality: number
}

export type SimResult = {
  hectares: number
  efficiency: number
  rankScore: number
  medal: Medal
  headline: string
  savedByIncident: IncidentResult[]
}

export const WINDOWS = [
  { appearMs: READ_MS, commitMs: CASA_END_MS },
  { appearMs: WATER_START_MS, commitMs: WATER_END_MS },
  { appearMs: CORRAL_START_MS, commitMs: MATCH_MS },
] as const

const KINDS: AssetKind[] = ['house', 'water', 'corral']
const RADII = [3, 2, 2]
const SPREADS = [1_550, 1_180, 860]

function idx(c: number, r: number): number {
  return r * COLS + c
}

function inb(c: number, r: number): boolean {
  return c >= 0 && r >= 0 && c < COLS && r < ROWS
}

function hash01(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

function mix(a: number, b: number): number {
  return (Math.imul(a ^ (b + 0x9e3779b9), 1103515245) >>> 0) % 0x7fffffff || 1
}

export function dayKey(now = Date.now()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date(now))
}

export function daySeed(now = Date.now()): number {
  const key = dayKey(now)
  let h = 2166136261
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619)
  return (h >>> 0) % 0x7fffffff || 1
}

export function playSeed(now = Date.now(), rematchIndex = 0): number {
  const day = daySeed(now)
  if (rematchIndex < REMATCH_KEEP_SEED) return day
  return mix(day, rematchIndex + 1)
}

export function snapStartNorm(): number {
  return SNAP_START_CELLS / Math.max(COLS, ROWS)
}

export function snapEndNorm(): number {
  return SNAP_END_CELLS / Math.max(COLS, ROWS)
}

export function dist2(a: Point, b: Point): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return dx * dx + dy * dy
}

export function normOfCell(cell: Cell): Point {
  return { x: (cell.c + 0.5) / COLS, y: (cell.r + 0.5) / ROWS }
}

export function cellOfNorm(p: Point): Cell {
  return {
    c: Math.max(0, Math.min(COLS - 1, Math.floor(p.x * COLS))),
    r: Math.max(0, Math.min(ROWS - 1, Math.floor(p.y * ROWS))),
  }
}

function bresenham(a: Cell, b: Cell): Cell[] {
  const out: Cell[] = []
  let c = a.c
  let r = a.r
  const dc = Math.abs(b.c - a.c)
  const dr = Math.abs(b.r - a.r)
  const sc = a.c < b.c ? 1 : -1
  const sr = a.r < b.r ? 1 : -1
  let err = dc - dr
  for (let n = 0; n < COLS + ROWS + 8; n++) {
    out.push({ c, r })
    if (c === b.c && r === b.r) break
    const e2 = 2 * err
    if (e2 > -dr) {
      err -= dr
      c += sc
    }
    if (e2 < dc) {
      err += dc
      r += sr
    }
  }
  return out
}

function paint(grid: Uint8Array, cells: Cell[], ter: Terrain, fat = false) {
  for (const cell of cells) {
    if (!inb(cell.c, cell.r)) continue
    grid[idx(cell.c, cell.r)] = ter
    if (!fat) continue
    for (const [dc, dr] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const c = cell.c + dc
      const r = cell.r + dr
      if (inb(c, r) && grid[idx(c, r)] !== TERRAIN.water) grid[idx(c, r)] = ter
    }
  }
}

function blob(grid: Uint8Array, cx: number, cy: number, rad: number, ter: Terrain) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (Math.hypot(c - cx, r - cy) <= rad) grid[idx(c, r)] = ter
    }
  }
}

function nearWater(grid: Uint8Array, c: number, r: number): boolean {
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (!inb(c + dc, r + dr)) continue
      if (grid[idx(c + dc, r + dr)] === TERRAIN.water) return true
    }
  }
  return false
}

export function travelCost(world: World, cell: Cell): number {
  const ter = world.terrain[idx(cell.c, cell.r)] as Terrain
  if (ter === TERRAIN.path) return 10
  if (ter === TERRAIN.field) return 14
  if (ter === TERRAIN.house || ter === TERRAIN.shed) return 12
  if (ter === TERRAIN.monte) return 16
  if (ter === TERRAIN.water) return nearWater(world.terrain, cell.c, cell.r) ? 18 : 80
  return 16
}

function costFast(world: World, cell: Cell): number {
  const ter = world.terrain[idx(cell.c, cell.r)] as Terrain
  if (ter === TERRAIN.path) return 8
  if (ter === TERRAIN.water) return 90
  return 22
}

function costSafe(world: World, cell: Cell): number {
  const ter = world.terrain[idx(cell.c, cell.r)] as Terrain
  if (ter === TERRAIN.monte) return 9
  if (ter === TERRAIN.field) return 10
  if (ter === TERRAIN.path) return 18
  if (ter === TERRAIN.water) return 90
  return 14
}

function costCut(world: World, cell: Cell): number {
  if (nearWater(world.terrain, cell.c, cell.r)) return 7
  const ter = world.terrain[idx(cell.c, cell.r)] as Terrain
  if (ter === TERRAIN.water) return 11
  if (ter === TERRAIN.path) return 16
  return 22
}

export function astar(
  world: World,
  start: Cell,
  goal: Cell,
  costFn: (world: World, cell: Cell) => number = travelCost,
): Cell[] | null {
  const n = COLS * ROWS
  const dist = new Float64Array(n).fill(1e12)
  const prev = new Int32Array(n).fill(-1)
  const seen = new Uint8Array(n)
  const startI = idx(start.c, start.r)
  const goalI = idx(goal.c, goal.r)
  dist[startI] = 0
  for (let step = 0; step < n; step++) {
    let best = -1
    let bestD = 1e12
    for (let i = 0; i < n; i++) {
      if (seen[i] || dist[i] >= bestD) continue
      bestD = dist[i]
      best = i
    }
    if (best < 0) break
    if (best === goalI) break
    seen[best] = 1
    const c = best % COLS
    const r = Math.floor(best / COLS)
    for (const [dc, dr] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const nc = c + dc
      const nr = r + dr
      if (!inb(nc, nr)) continue
      const ni = idx(nc, nr)
      const cost = costFn(world, { c: nc, r: nr })
      const nd = dist[best] + cost
      if (nd < dist[ni]) {
        dist[ni] = nd
        prev[ni] = best
      }
    }
  }
  if (prev[goalI] < 0 && startI !== goalI) return null
  const path: Cell[] = []
  let cur = goalI
  while (cur >= 0) {
    path.push({ c: cur % COLS, r: Math.floor(cur / COLS) })
    cur = prev[cur]
  }
  path.reverse()
  if (path[0]?.c !== start.c || path[0]?.r !== start.r) path.unshift(start)
  return path
}

function ensurePath(world: World, a: Cell, b: Cell) {
  if (astar(world, a, b)) return
  paint(world.terrain, bresenham(a, b), TERRAIN.path)
}

function clampCell(c: number, r: number): Cell {
  return {
    c: Math.max(0, Math.min(COLS - 1, Math.round(c))),
    r: Math.max(0, Math.min(ROWS - 1, Math.round(r))),
  }
}

export function createWorld(seed: number): World {
  const s = seed >>> 0 || 1
  const terrain = new Uint8Array(COLS * ROWS)
  terrain.fill(TERRAIN.field)

  const node = { c: 1, r: ROWS - 2 }
  const dirs: Wind[] = [
    { c: 1, r: 0 },
    { c: 1, r: -1 },
    { c: 0, r: -1 },
    { c: -1, r: -1 },
    { c: -1, r: 0 },
    { c: -1, r: 1 },
    { c: 0, r: 1 },
    { c: 1, r: 1 },
  ]
  const wind = dirs[s % dirs.length]!
  const len = Math.hypot(wind.c, wind.r) || 1
  const unit: Wind = { c: wind.c / len, r: wind.r / len }

  const wc = 8 + (s % 3)
  const wr = 6 + ((s >> 2) % 3)
  blob(terrain, wc, wr, 1.85, TERRAIN.water)

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (terrain[idx(c, r)] === TERRAIN.water) continue
      const n = hash01(s * 0.013 + c * 19.1 + r * 7.7)
      if (n > 0.62 && Math.hypot(c - node.c, r - node.r) > 2.2) terrain[idx(c, r)] = TERRAIN.monte
    }
  }

  const house = clampCell(5 + (s % 2), ROWS - 8 - ((s >> 3) % 2))
  const waterAsset = clampCell(wc - 1, wr - 1)
  const corral = clampCell(COLS - 2, 2 + ((s >> 4) % 2))

  const fastWay = [
    node,
    { c: 3, r: ROWS - 4 },
    { c: 5, r: ROWS - 7 },
    house,
    { c: 8, r: 6 },
    waterAsset,
    { c: 10, r: 3 },
    corral,
  ]
  const safeWay = [
    node,
    { c: 1, r: ROWS - 5 },
    { c: 1, r: 9 },
    { c: 2, r: 5 },
    { c: 6, r: 3 },
    corral,
  ]
  const cutWay = [
    node,
    { c: 4, r: ROWS - 3 },
    { c: wc - 2, r: wr + 1 },
    { c: wc + 1, r: wr },
    waterAsset,
    { c: COLS - 2, r: wr - 2 },
    corral,
  ]

  for (let i = 0; i < fastWay.length - 1; i++) paint(terrain, bresenham(fastWay[i]!, fastWay[i + 1]!), TERRAIN.path)
  for (let i = 0; i < safeWay.length - 1; i++) paint(terrain, bresenham(safeWay[i]!, safeWay[i + 1]!), TERRAIN.path)
  for (let i = 0; i < cutWay.length - 1; i++) {
    const cells = bresenham(cutWay[i]!, cutWay[i + 1]!)
    for (const cell of cells) {
      if (terrain[idx(cell.c, cell.r)] === TERRAIN.water) continue
      terrain[idx(cell.c, cell.r)] = TERRAIN.path
    }
  }

  terrain[idx(node.c, node.r)] = TERRAIN.shed
  terrain[idx(house.c, house.r)] = TERRAIN.house
  if (inb(house.c + 1, house.r)) terrain[idx(house.c + 1, house.r)] = TERRAIN.house
  terrain[idx(waterAsset.c, waterAsset.r)] = TERRAIN.shed
  terrain[idx(corral.c, corral.r)] = TERRAIN.shed
  if (inb(corral.c - 1, corral.r)) terrain[idx(corral.c - 1, corral.r)] = TERRAIN.shed

  const foci = [house, waterAsset, corral]
  const world: World = {
    seed: s,
    cols: COLS,
    rows: ROWS,
    terrain,
    node,
    wind: unit,
    incidents: foci.map((focus, id) => ({
      id,
      kind: KINDS[id]!,
      appearMs: WINDOWS[id]!.appearMs,
      commitMs: WINDOWS[id]!.commitMs,
      focus,
      node,
      wind: unit,
      radius: RADII[id]!,
      spreadMs: SPREADS[id]!,
    })),
  }

  for (const inc of world.incidents) ensurePath(world, world.node, inc.focus)
  return world
}

export function incidentAt(t: number, world: World): Incident | null {
  for (const inc of world.incidents) {
    if (t >= inc.appearMs && t < inc.commitMs) return inc
  }
  return null
}

export function isTelegraph(t: number): boolean {
  return t < TELEGRAPH_MS
}

export function isGuiding(t: number): boolean {
  return t >= READ_MS - 1_000 && t < READ_MS
}

export function isClutch(t: number, inc: Incident | null): boolean {
  if (!inc) return false
  return inc.id === FOCO_N - 1 && t >= inc.appearMs && t < inc.commitMs
}

export function guidePath(world: World, incident: Incident): Cell[] {
  return astar(world, world.node, incident.focus) ?? bresenham(world.node, incident.focus)
}

export function firstGuidePath(world: World): Cell[] {
  return guidePath(world, world.incidents[0]!)
}

export function travelMsForCells(world: World, cells: Cell[]): number {
  let ms = 0
  for (const cell of cells) {
    const ter = world.terrain[idx(cell.c, cell.r)] as Terrain
    if (ter === TERRAIN.path) ms += 85
    else if (ter === TERRAIN.monte) ms += 165
    else if (ter === TERRAIN.water) ms += 230
    else if (ter === TERRAIN.field) ms += 125
    else ms += 110
  }
  return ms
}

export function assetDeadlineMs(incident: Incident): number {
  const window = Math.max(1, incident.commitMs - incident.appearMs)
  // El temporizador grande cuenta la ronda; éste es el que realmente importa
  // para cada foco. Reservamos el final de cada ventana para que se vea el
  // incendio y entre el siguiente foco, no para castigar a quien ya entendió
  // el gesto. El primer foco tiene aún más aire porque es el FTUE real.
  const frac = incident.id === 0 ? 0.86 : incident.id === 1 ? 0.82 : 0.84
  return incident.appearMs + window * frac
}

export function fireTimeMs(incident: Incident, cell: Cell): number {
  const dx = cell.c - incident.focus.c
  const dy = cell.r - incident.focus.r
  const dist = Math.hypot(dx, dy)
  const origin = assetDeadlineMs(incident)
  const windDot = dist < 0.001 ? 1 : (dx * incident.wind.c + dy * incident.wind.r) / dist
  const aligned = (windDot + 1) / 2
  return origin + dist * incident.spreadMs * (0.7 - aligned * 0.32)
}

export function assetCells(world: World, inc: Incident): Cell[] {
  const out: Cell[] = []
  const extra =
    inc.kind === 'house'
      ? [
          [0, 0],
          [1, 0],
          [0, 1],
        ]
      : inc.kind === 'water'
        ? [
            [0, 0],
            [1, 0],
            [0, -1],
          ]
        : [
            [0, 0],
            [-1, 0],
            [0, 1],
            [1, 0],
          ]
  for (const [dc, dr] of extra) {
    const c = inc.focus.c + dc
    const r = inc.focus.r + dr
    if (inb(c, r)) out.push({ c, r })
  }
  void world
  return out
}

export function rasterizeStroke(world: World, points: Point[]): Cell[] {
  const cells: Cell[] = []
  const push = (cell: Cell) => {
    const last = cells[cells.length - 1]
    if (last && last.c === cell.c && last.r === cell.r) return
    cells.push(cell)
  }
  if (points.length === 0) return cells
  if (points.length === 1) {
    push(cellOfNorm(points[0]!))
    return cells
  }
  for (let i = 1; i < points.length; i++) {
    const a = cellOfNorm(points[i - 1]!)
    const b = cellOfNorm(points[i]!)
    for (const cell of bresenham(a, b)) push(cell)
  }
  return cells
}

export function strokeOnRoad(world: World, cells: Cell[]): number {
  if (cells.length === 0) return 0
  let path = 0
  for (const cell of cells) {
    if (world.terrain[idx(cell.c, cell.r)] === TERRAIN.path) path++
  }
  return path / cells.length
}

function nearNode(world: World, pt: Point): boolean {
  return dist2(pt, normOfCell(world.node)) <= snapStartNorm() ** 2
}

function nearFocus(world: World, inc: Incident, pt: Point): boolean {
  if (dist2(pt, normOfCell(inc.focus)) <= snapEndNorm() ** 2) return true
  for (const cell of assetCells(world, inc)) {
    if (dist2(pt, normOfCell(cell)) <= (snapEndNorm() * 0.92) ** 2) return true
  }
  return false
}

export function snapStart(world: World, pt: Point): { ok: boolean; snapped: Point } {
  if (!nearNode(world, pt)) return { ok: false, snapped: pt }
  return { ok: true, snapped: normOfCell(world.node) }
}

export function snapEnd(world: World, inc: Incident, pt: Point): { ok: boolean; snapped: Point } {
  if (!nearFocus(world, inc, pt)) return { ok: false, snapped: pt }
  return { ok: true, snapped: normOfCell(inc.focus) }
}

function etaFromSlack(slack: number): EtaBand {
  if (slack > 1_600) return 'green'
  if (slack > 0) return 'amber'
  return 'red'
}

export function previewEta(world: World, incident: Incident, points: Point[], nowMs: number): EtaBand {
  // El gesto selecciona la salida y el foco; no debe volverse una prueba de
  // caligrafía. Un temblor o una vuelta de más jamás puede cambiar el ETA.
  void points
  const arrival = nowMs + travelMsForCells(world, guidePath(world, incident))
  return etaFromSlack(assetDeadlineMs(incident) - arrival)
}

export function resolveIncident(world: World, incident: Incident, stroke: Stroke | null): IncidentResult {
  const empty: IncidentResult = { id: incident.id, arrived: false, saved: 0, cells: [], late: true, eta: 'red', quality: 0 }
  if (!stroke || stroke.points.length < 2) return empty
  const first = stroke.points[0]!
  const last = stroke.points[stroke.points.length - 1]!
  if (!nearNode(world, first) && !nearNode(world, stroke.points[1] ?? first)) return empty
  if (!nearFocus(world, incident, last)) return empty
  if (stroke.t1 < incident.appearMs || stroke.t0 >= incident.commitMs) return empty

  // Igual que el preview: el jugador confirma base → foco. La simulación abre
  // el corredor seguro y sólo mide su tiempo de respuesta, no la forma del dedo.
  const cells = guidePath(world, incident)
  const arrival = Math.max(stroke.t0, stroke.t1) + travelMsForCells(world, cells)
  const fireAt = assetDeadlineMs(incident)
  const slack = fireAt - arrival
  const eta = etaFromSlack(slack)
  const late = slack <= 1_600
  const savedCells: Cell[] = []
  for (let r = incident.focus.r - incident.radius; r <= incident.focus.r + incident.radius; r++) {
    for (let c = incident.focus.c - incident.radius; c <= incident.focus.c + incident.radius; c++) {
      if (!inb(c, r)) continue
      const cell = { c, r }
      if (world.terrain[idx(c, r)] === TERRAIN.water) continue
      if (fireTimeMs(incident, cell) <= arrival) continue
      savedCells.push(cell)
    }
  }
  const quality = 1
  return { id: incident.id, arrived: savedCells.length > 0, saved: savedCells.length, cells: savedCells, late, eta, quality }
}

function medalFor(rows: IncidentResult[]): Medal {
  const onTime = rows.filter((row) => row.arrived && !row.late).length
  const arrived = rows.filter((row) => row.arrived).length
  if (onTime === FOCO_N) return 'OJO DE FUEGO'
  if (arrived >= 2) return 'RUTA CLARA'
  return 'ALERTA'
}

export function scoreFromRows(rows: IncidentResult[]): Pick<SimResult, 'hectares' | 'efficiency' | 'rankScore' | 'medal' | 'headline'> {
  const hectares = rows.reduce((sum, row) => sum + row.saved, 0)
  const arrived = rows.filter((row) => row.arrived).length
  const qualityAvg = arrived > 0 ? rows.filter((row) => row.arrived).reduce((s, r) => s + r.quality, 0) / arrived : 0
  const cap = arrived * 14
  const efficiency = cap > 0 ? Math.min(100, Math.round((hectares / cap) * 100)) : 0
  const earlyBonus = rows.reduce((s, r) => s + (r.arrived && !r.late ? 4 : 0) + (r.eta === 'green' ? 3 : 0), 0)
  const qualityBonus = Math.round(qualityAvg * 12)
  return {
    hectares,
    efficiency,
    rankScore: hectares * 1000 + efficiency * 10 + earlyBonus * 40 + qualityBonus,
    medal: medalFor(rows),
    headline: whyLine(rows),
  }
}

function whyLine(rows: IncidentResult[]): string {
  const arrived = rows.filter((r) => r.arrived)
  const late = arrived.filter((r) => r.late)
  if (arrived.length === 0) return 'El humo llegó primero. Quedó una ruta.'
  if (arrived.length === 3 && late.length === 0) return 'Tres rutas a tiempo. El predio aguanta.'
  if (arrived.length === 3) return 'Tres focos, uno justo. Se puede apretar.'
  if (arrived.length === 2) return late.length ? 'Dos salvados, uno tarde. Hay margen.' : 'Dos a tiempo. El tercero espera.'
  if (late.length) return 'Una ruta, tarde. La siguiente perdona.'
  return 'Una a tiempo. El predio pide más.'
}

export function simulateRun(seed: number, strokes: Stroke[]): SimResult {
  const world = createWorld(seed)
  const used = new Set<number>()
  const savedByIncident: IncidentResult[] = world.incidents.map((inc) => {
    const stroke = strokes.find((row) => row.incident === inc.id && !used.has(row.incident)) ?? null
    if (stroke) used.add(inc.id)
    if (stroke && (stroke.t1 < inc.appearMs || stroke.t0 >= inc.commitMs)) {
      return { id: inc.id, arrived: false, saved: 0, cells: [], late: true, eta: 'red' as const, quality: 0 }
    }
    return resolveIncident(world, inc, stroke)
  })
  return { ...scoreFromRows(savedByIncident), savedByIncident }
}

export function corridorCells(world: World, incidentId: number, corridor: CorridorId): Cell[] {
  const inc = world.incidents[incidentId]
  if (!inc) return []
  const fn = corridor === 'fast' ? costFast : corridor === 'safe' ? costSafe : costCut
  return astar(world, world.node, inc.focus, fn) ?? firstGuidePath(world)
}

export function corridorStroke(world: World, incidentId: number, corridor: CorridorId, t0: number): Stroke {
  const inc = world.incidents[incidentId]!
  const cells = corridorCells(world, incidentId, corridor)
  let extra = 0
  if (corridor === 'cut') {
    const dot = (inc.focus.c - world.node.c) * world.wind.c + (inc.focus.r - world.node.r) * world.wind.r
    extra = dot < 0 ? 4_800 : -280
  }
  if (corridor === 'safe') extra += 2_400
  const t1 = Math.min(inc.commitMs - 30, t0 + 280 + extra)
  return {
    incident: incidentId,
    points: cells.map(normOfCell),
    t0,
    t1,
  }
}

export function optimalStrokes(seed: number): Stroke[] {
  const world = createWorld(seed)
  return world.incidents.map((inc) => {
    const t0 = inc.appearMs + (inc.id === 0 ? GUIDE_MS * 0.25 : 180)
    return corridorStroke(world, inc.id, 'fast', t0)
  })
}

export function parseStrokes(raw: unknown): Stroke[] | null {
  if (!Array.isArray(raw)) return null
  const out: Stroke[] = []
  for (const row of raw) {
    if (!row || typeof row !== 'object') return null
    const rec = row as Record<string, unknown>
    const incident = Number(rec.incident)
    const t0 = Number(rec.t0)
    const t1 = Number(rec.t1)
    if (!Number.isInteger(incident) || incident < 0 || incident >= FOCO_N) return null
    if (!Number.isFinite(t0) || !Number.isFinite(t1)) return null
    if (!Array.isArray(rec.points) || rec.points.length < 1 || rec.points.length > 128) return null
    const points: Point[] = []
    for (const p of rec.points) {
      if (!p || typeof p !== 'object') return null
      const x = Number((p as { x?: unknown }).x)
      const y = Number((p as { y?: unknown }).y)
      if (!Number.isFinite(x) || !Number.isFinite(y)) return null
      points.push({ x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) })
    }
    out.push({ incident, points, t0, t1 })
  }
  return out
}

export function encodeShareSeed(seed: number): string {
  return (seed >>> 0).toString(36)
}

export function parseShareSeed(raw: string | null | undefined): number | null {
  if (!raw) return null
  const n = parseInt(raw, 36)
  if (!Number.isInteger(n) || n <= 0 || n > 0x7fffffff) return null
  return n
}

export function reachable(seed: number): boolean {
  const world = createWorld(seed)
  return world.incidents.every((inc) => {
    const path = astar(world, world.node, inc.focus)
    return Boolean(path && path.length > 1)
  })
}
