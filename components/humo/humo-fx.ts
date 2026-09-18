import {
  COLS,
  ROWS,
  TERRAIN,
  assetCells,
  fireTimeMs,
  firstGuidePath,
  guidePath,
  incidentAt,
  normOfCell,
  type Cell,
  type EtaBand,
  type Incident,
  type Stroke,
  type Terrain,
  type World,
} from '@/lib/humo/sim'

export type Juice = { label: string; color: string; born: number; scale?: number }
export type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number; kind?: 'ember' | 'dust' | 'smoke' | 'water' }
export type Floater = { text: string; x: number; y: number; born: number; color: string }
export type SavedCell = Cell & { born: number; delay: number }
export type Shock = { x: number; y: number; born: number; color: string }
export type FlashTint = 'save' | 'miss' | 'fire'
export type GridLayout = { ox: number; oy: number; cell: number; cellW: number; cellH: number; gridW: number; gridH: number }
export type Point = { x: number; y: number }

export type DrawOpts = {
  world: World | null
  phase: 'boot' | 'ready' | 'play' | 'end'
  t: number
  now: number
  juice: Juice[]
  drawing: Stroke | null
  strokes: Stroke[]
  saved: SavedCell[]
  ghost: Cell[]
  particles: Particle[]
  floaters: Floater[]
  shocks: Shock[]
  layout: GridLayout
  shake: number
  flash: number
  flashTint: FlashTint
  onRoad: boolean
  clutch: boolean
  hint: boolean
  canAct: boolean
  guide: Point[]
  runner: { points: Point[]; born: number } | null
  eta: EtaBand | null
  reduced: boolean
  grabAt?: number
  snapAt?: number
  haShown?: number
  cleared?: Set<number>
}

const NIGHT = '#0D1210'
const MONTE = '#253C29'
const MONTE2 = '#3E5A32'
const TIERRA = '#8B5E34'
const TIERRA2 = '#C99052'
const BRASA = '#FF5A36'
const BRASA2 = '#FF9F1C'
const AURA = '#19C37D'
const CREMA = '#F4E7CF'

type Region = { kind: Terrain; cells: Cell[] }

const regionCache = new WeakMap<World, Region[]>()

export function hash01(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

export function gridLayout(w: number, h: number): GridLayout {
  // Un canvas puede reportar 0×0 un frame al montar, al ocultarse o al volver
  // desde otra pestaña. Nunca devolvemos celdas negativas: un solo arc inválido
  // detiene para siempre el requestAnimationFrame del juego.
  if (w < 1 || h < 1) {
    return { ox: 0, oy: 0, cell: 1, cellW: 1, cellH: 1, gridW: 1, gridH: 1 }
  }
  const portrait = h >= w * 0.92
  if (portrait) {
    const gridW = w
    const gridH = Math.min(h * 0.72, Math.max(h * 0.62, h * 0.68))
    const sky = Math.max(40, h * 0.075)
    const oy = sky
    const cellW = gridW / COLS
    const cellH = gridH / ROWS
    return { ox: 0, oy, cell: Math.min(cellW, cellH), cellW, cellH, gridW, gridH }
  }
  const padY = Math.max(8, h * 0.02)
  const padX = Math.max(8, w * 0.015)
  const gridH = h - padY * 2
  const gridW = w - padX * 2
  const ox = (w - gridW) / 2
  const cellW = gridW / COLS
  const cellH = gridH / ROWS
  return { ox, oy: padY, cell: Math.min(cellW, cellH), cellW, cellH, gridW, gridH }
}

export function cellRect(layout: GridLayout, c: number, r: number) {
  const w = layout.cellW
  const h = layout.cellH
  return { x: layout.ox + c * w, y: layout.oy + r * h, s: Math.min(w, h), w, h }
}

export function worldToPx(layout: GridLayout, p: Point) {
  return { x: layout.ox + p.x * layout.gridW, y: layout.oy + p.y * layout.gridH }
}

export function spawnBurst(x: number, y: number, color: string, n: number, speed = 0.9, kind: Particle['kind'] = 'dust'): Particle[] {
  const out: Particle[] = []
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * Math.PI * 2 + hash01(i + x) * 0.4
    const sp = speed * (0.35 + hash01(i * 3 + y) * 0.9)
    out.push({
      x,
      y,
      vx: Math.cos(ang) * sp,
      vy: Math.sin(ang) * sp - (kind === 'ember' ? 0.35 : 0),
      life: 1,
      color,
      size: 1.6 + hash01(i * 9) * 2.4,
      kind,
    })
  }
  return out
}

export function spawnWind(layout: GridLayout, world: World, now: number): Particle[] {
  const out: Particle[] = []
  for (let i = 0; i < 6; i++) {
    const u = (now / 1400 + i * 0.13) % 1
    out.push({
      x: layout.ox + (0.04 + hash01(i * 4) * 0.9 + world.wind.c * u * 0.18) * layout.gridW,
      y: layout.oy + (0.06 + hash01(i * 7) * 0.82 + world.wind.r * u * 0.12) * layout.gridH,
      vx: world.wind.c * 0.7,
      vy: world.wind.r * 0.45 - 0.12,
      life: 0.7,
      color: 'rgba(244,231,207,0.22)',
      size: 8 + hash01(i * 5) * 10,
      kind: 'smoke',
    })
  }
  return out
}

export function stepParticles(particles: Particle[]): Particle[] {
  for (const p of particles) {
    p.x += p.vx
    p.y += p.vy
    if (p.kind === 'smoke') {
      p.vx *= 0.99
      p.vy -= 0.004
      p.size += 0.08
    } else if (p.kind === 'ember') {
      p.vy -= 0.02
    } else {
      p.vy -= 0.01
    }
    p.life -= p.kind === 'smoke' ? 0.012 : 0.028
  }
  return particles.filter((p) => p.life > 0)
}

function clock(now: number, reduced: boolean) {
  return reduced ? 0 : now
}

function regionsOf(world: World): Region[] {
  const hit = regionCache.get(world)
  if (hit) return hit
  const seen = new Uint8Array(COLS * ROWS)
  const out: Region[] = []
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]
  for (let i = 0; i < world.terrain.length; i++) {
    if (seen[i]) continue
    const kind = world.terrain[i] as Terrain
    const stack = [i]
    seen[i] = 1
    const cells: Cell[] = []
    while (stack.length) {
      const cur = stack.pop()!
      const c = cur % COLS
      const r = (cur / COLS) | 0
      cells.push({ c, r })
      for (const [dc, dr] of dirs) {
        const nc = c + dc
        const nr = r + dr
        if (nc < 0 || nr < 0 || nc >= COLS || nr >= ROWS) continue
        const ni = nr * COLS + nc
        if (seen[ni] || world.terrain[ni] !== kind) continue
        seen[ni] = 1
        stack.push(ni)
      }
    }
    out.push({ kind, cells })
  }
  regionCache.set(world, out)
  return out
}

function noisyBlob(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, seed: number, n = 11) {
  ctx.beginPath()
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2
    const k = 0.72 + hash01(seed + i * 1.7) * 0.46
    const x = cx + Math.cos(a) * rx * k
    const y = cy + Math.sin(a) * ry * k
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
}

// Para vegetación usamos bordes orgánicos suaves; el blob anguloso se reserva
// para humo, tierra quemada y fuego. Así el monte no se lee como low-poly.
function softBlob(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, seed: number, n = 10) {
  const pts: Point[] = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    const k = 0.78 + hash01(seed + i * 1.7) * 0.36
    pts.push({ x: cx + Math.cos(a) * rx * k, y: cy + Math.sin(a) * ry * k })
  }
  const first = pts[0]!
  const last = pts[pts.length - 1]!
  ctx.beginPath()
  ctx.moveTo((last.x + first.x) / 2, (last.y + first.y) / 2)
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i]!
    const next = pts[(i + 1) % pts.length]!
    ctx.quadraticCurveTo(p.x, p.y, (p.x + next.x) / 2, (p.y + next.y) / 2)
  }
  ctx.closePath()
}

function drawSky(ctx: CanvasRenderingContext2D, w: number, h: number, clutch: boolean, now: number, reduced: boolean) {
  const t = clock(now, reduced)
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, clutch ? '#3a2214' : '#24301f')
  g.addColorStop(0.12, clutch ? '#4a2a16' : '#3d2a18')
  g.addColorStop(0.22, clutch ? '#2a1810' : '#1a2218')
  g.addColorStop(0.55, NIGHT)
  g.addColorStop(1, '#0a0e0c')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)

  const sunX = w * 0.72
  const sunY = h * 0.07
  const sun = ctx.createRadialGradient(sunX, sunY, 2, sunX, sunY, Math.max(w, h) * 0.34)
  sun.addColorStop(0, `rgba(255,159,28,${clutch ? 0.42 : 0.22})`)
  sun.addColorStop(0.35, `rgba(255,90,54,${clutch ? 0.16 : 0.08})`)
  sun.addColorStop(1, 'rgba(255,90,54,0)')
  ctx.fillStyle = sun
  ctx.fillRect(0, 0, w, h * 0.38)

  ctx.fillStyle = clutch ? '#1a100c' : '#141c14'
  ctx.beginPath()
  ctx.moveTo(0, h * 0.16)
  for (let i = 0; i <= 12; i++) {
    const x = (i / 12) * w
    const y = h * (0.09 + hash01(i * 3.1) * 0.055 + Math.sin(t / 11000 + i) * 0.003)
    ctx.lineTo(x, y)
  }
  ctx.lineTo(w, h * 0.22)
  ctx.lineTo(0, h * 0.22)
  ctx.fill()
}

function chaikin(pts: Point[], rounds = 2): Point[] {
  let cur = pts
  for (let r = 0; r < rounds; r++) {
    if (cur.length < 3) break
    const next: Point[] = [cur[0]!]
    for (let i = 0; i < cur.length - 1; i++) {
      const a = cur[i]!
      const b = cur[i + 1]!
      next.push({ x: a.x * 0.75 + b.x * 0.25, y: a.y * 0.75 + b.y * 0.25 })
      next.push({ x: a.x * 0.25 + b.x * 0.75, y: a.y * 0.25 + b.y * 0.75 })
    }
    next.push(cur[cur.length - 1]!)
    cur = next
  }
  return cur
}

function orderNearest(pts: Point[]): Point[] {
  if (pts.length < 2) return pts
  const used = new Set<number>([0])
  const out: Point[] = [pts[0]!]
  let cur = 0
  while (used.size < pts.length) {
    let best = -1
    let bestD = 1e9
    const a = pts[cur]!
    for (let i = 0; i < pts.length; i++) {
      if (used.has(i)) continue
      const b = pts[i]!
      const d = (a.x - b.x) ** 2 + (a.y - b.y) ** 2
      if (d < bestD) {
        bestD = d
        best = i
      }
    }
    if (best < 0) break
    used.add(best)
    out.push(pts[best]!)
    cur = best
  }
  return out
}

function strokePoly(ctx: CanvasRenderingContext2D, pts: Point[]) {
  if (pts.length < 2) return
  ctx.beginPath()
  ctx.moveTo(pts[0]!.x, pts[0]!.y)
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i]!.x, pts[i]!.y)
  ctx.stroke()
}

function offsetPoly(pts: Point[], dist: number): Point[] {
  return pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)]!
    const b = pts[Math.min(pts.length - 1, i + 1)]!
    const dx = b.x - a.x
    const dy = b.y - a.y
    const len = Math.hypot(dx, dy) || 1
    return { x: p.x - (dy / len) * dist, y: p.y + (dx / len) * dist }
  })
}

function fillEllipse(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number) {
  ctx.beginPath()
  ctx.ellipse(x, y, Math.max(1.1, rx), Math.max(1.1, ry), 0, 0, Math.PI * 2)
  ctx.fill()
}

function drawTerrain(ctx: CanvasRenderingContext2D, w: number, h: number, layout: GridLayout, world: World, now: number, reduced: boolean) {
  const t = clock(now, reduced)
  const soilTop = Math.max(0, layout.oy - 18)
  const soil = ctx.createLinearGradient(0, soilTop, 0, h)
  soil.addColorStop(0, '#5a3e28')
  soil.addColorStop(0.32, '#3f2b1a')
  soil.addColorStop(1, '#24180f')
  ctx.fillStyle = soil
  ctx.fillRect(0, soilTop, w, h - soilTop)

  ctx.fillStyle = 'rgba(90,62,38,0.22)'
  for (let i = 0; i < 16; i++) {
    const x = hash01(world.seed + i * 1.3) * w
    const y = soilTop + hash01(world.seed + i * 4.1) * (h - soilTop)
    fillEllipse(ctx, x, y, 34 + hash01(i) * 48, 10 + hash01(i * 2) * 16)
  }

  ctx.strokeStyle = 'rgba(201,144,82,0.22)'
  ctx.lineWidth = 1.2
  ctx.lineCap = 'round'
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (world.terrain[r * COLS + c] !== TERRAIN.field) continue
      if (hash01(world.seed + r * 17 + c) < 0.28) continue
      const a = cellRect(layout, c, r)
      const y = a.y + a.h * (0.28 + hash01(r * 9 + c) * 0.5)
      ctx.beginPath()
      ctx.moveTo(a.x + 1, y)
      ctx.quadraticCurveTo(a.x + a.w * 0.5, y + (hash01(c * 3 + r) - 0.5) * 5, a.x + a.w - 1, y + 1)
      ctx.stroke()
    }
  }

  const regions = regionsOf(world)
  drawScrub(ctx, layout, world)
  for (const region of regions) {
    if (region.kind === TERRAIN.water) drawPond(ctx, layout, region.cells, t, world.seed)
  }
  drawRoads(ctx, layout, world)
  drawMonte(ctx, layout, world)
}

function drawRoads(ctx: CanvasRenderingContext2D, layout: GridLayout, world: World) {
  const raw: Point[] = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (world.terrain[r * COLS + c] !== TERRAIN.path) continue
      raw.push({
        x: layout.ox + (c + 0.5) * layout.cellW,
        y: layout.oy + (r + 0.5) * layout.cellH,
      })
    }
  }
  if (raw.length < 2) return
  const pts = chaikin(orderNearest(raw), 2)
  const width = Math.max(11, layout.cell * 0.78)
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.strokeStyle = '#4a2e18'
  ctx.lineWidth = width + 3
  strokePoly(ctx, pts)
  ctx.strokeStyle = TIERRA
  ctx.lineWidth = width
  strokePoly(ctx, pts)
  ctx.strokeStyle = '#c9905288'
  ctx.lineWidth = Math.max(2, width * 0.22)
  strokePoly(ctx, pts)
  ctx.strokeStyle = 'rgba(42,26,14,0.45)'
  ctx.lineWidth = 1.4
  strokePoly(ctx, offsetPoly(pts, width * 0.22))
  strokePoly(ctx, offsetPoly(pts, -width * 0.22))
}

function drawScrub(ctx: CanvasRenderingContext2D, layout: GridLayout, world: World) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (world.terrain[r * COLS + c] !== TERRAIN.monte) continue
      const cell = cellRect(layout, c, r)
      const n = hash01(world.seed + c * 13 + r * 29)
      const x = cell.x + cell.w * (0.3 + n * 0.4)
      const y = cell.y + cell.h * (0.55 + hash01(c + r) * 0.3)
      ctx.fillStyle = n > 0.55 ? '#1c2a1a' : '#243422'
      softBlob(ctx, x, y, cell.w * (0.25 + n * 0.18), cell.h * (0.13 + n * 0.1), world.seed + c * 9 + r * 5, 7)
      ctx.fill()
      if (n > 0.68) {
        ctx.strokeStyle = 'rgba(201,144,82,0.36)'
        ctx.lineWidth = Math.max(0.7, layout.cell * 0.025)
        for (let blade = 0; blade < 3; blade++) {
          const bx = x + (blade - 1) * cell.w * 0.1
          ctx.beginPath()
          ctx.moveTo(bx, y + cell.h * 0.05)
          ctx.lineTo(bx + (hash01(world.seed + blade + c) - 0.5) * cell.w * 0.16, y - cell.h * (0.09 + blade * 0.025))
          ctx.stroke()
        }
      }
    }
  }
}

function drawMonte(ctx: CanvasRenderingContext2D, layout: GridLayout, world: World) {
  const plants: { x: number; y: number; s: number; seed: number; kind: 'tree' | 'bush' }[] = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (world.terrain[r * COLS + c] !== TERRAIN.monte) continue
      const n = hash01(world.seed * 0.17 + c * 19 + r * 41)
      if (n < 0.62) continue
      const cell = cellRect(layout, c, r)
      plants.push({
        x: cell.x + cell.w * (0.28 + hash01(c * 7 + r) * 0.44),
        y: cell.y + cell.h * (0.62 + hash01(c * 11 + r * 3) * 0.28),
        s: layout.cell * (n > 0.86 ? 1.15 + n * 0.35 : 0.55 + n * 0.35),
        seed: world.seed + c * 31 + r * 17,
        kind: n > 0.86 ? 'tree' : 'bush',
      })
    }
  }
  plants.sort((a, b) => a.y - b.y)
  for (const plant of plants) drawTree(ctx, plant.x, plant.y, plant.s, plant.seed, plant.kind)
}

function drawTree(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, seed: number, kind: 'tree' | 'bush' = 'tree') {
  const lean = (hash01(seed) - 0.5) * (kind === 'tree' ? 0.28 : 0.12)
  if (kind === 'tree') {
    const trunkH = s * (0.62 + hash01(seed + 1) * 0.28)
    const trunkW = Math.max(2.4, s * 0.1)
    ctx.fillStyle = '#342419'
    ctx.beginPath()
    ctx.moveTo(x - trunkW, y)
    ctx.lineTo(x + trunkW, y)
    ctx.lineTo(x + trunkW * 0.4 + lean * s, y - trunkH)
    ctx.lineTo(x - trunkW * 0.4 + lean * s, y - trunkH)
    ctx.closePath()
    ctx.fill()
    const crownY = y - trunkH * 0.88
    const crownX = x + lean * s * 0.5
    ctx.strokeStyle = '#5e4027'
    ctx.lineWidth = Math.max(1.6, trunkW * 0.7)
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(x + lean * s * 0.12, y - trunkH * 0.38)
    ctx.lineTo(crownX - s * 0.28, crownY + s * 0.15)
    ctx.moveTo(x + lean * s * 0.14, y - trunkH * 0.52)
    ctx.lineTo(crownX + s * 0.31, crownY + s * 0.11)
    ctx.stroke()
    ctx.fillStyle = '#172719'
    softBlob(ctx, crownX, crownY + s * 0.05, s * 0.76, s * 0.48, seed + 2, 9)
    ctx.fill()
    ctx.fillStyle = hash01(seed + 3) > 0.5 ? '#294229' : '#314d2d'
    softBlob(ctx, crownX - s * 0.22, crownY - s * 0.08, s * 0.46, s * 0.34, seed + 8, 8)
    ctx.fill()
    ctx.fillStyle = '#3d5931'
    softBlob(ctx, crownX + s * 0.23, crownY - s * 0.03, s * 0.4, s * 0.3, seed + 13, 8)
    ctx.fill()
    ctx.fillStyle = hash01(seed + 7) > 0.52 ? '#58703a' : '#4d6637'
    softBlob(ctx, crownX + s * (hash01(seed + 9) - 0.5) * 0.18, crownY - s * 0.23, s * 0.32, s * 0.24, seed + 21, 7)
    ctx.fill()
    return
  }
  ctx.fillStyle = '#192819'
  softBlob(ctx, x, y, s * 0.46, s * 0.23, seed + 2, 7)
  ctx.fill()
  ctx.fillStyle = hash01(seed) > 0.5 ? '#2d482b' : '#365230'
  softBlob(ctx, x + lean * s, y - s * 0.17, s * 0.38, s * 0.25, seed + 7, 7)
  ctx.fill()
  ctx.fillStyle = '#506838'
  softBlob(ctx, x - s * 0.14, y - s * 0.12, s * 0.22, s * 0.15, seed + 12, 6)
  ctx.fill()
}

function drawPond(ctx: CanvasRenderingContext2D, layout: GridLayout, cells: Cell[], now: number, seed: number) {
  if (!cells.length) return
  let sx = 0
  let sy = 0
  for (const cell of cells) {
    const p = cellRect(layout, cell.c, cell.r)
    sx += p.x + p.w / 2
    sy += p.y + p.h / 2
  }
  const cx = sx / cells.length
  const cy = sy / cells.length
  const rx = Math.max(layout.cellW * 1.7, Math.sqrt(cells.length) * layout.cellW * 0.72)
  const ry = Math.max(layout.cellH * 1.15, Math.sqrt(cells.length) * layout.cellH * 0.5)
  ctx.fillStyle = '#3a2a1c'
  noisyBlob(ctx, cx, cy + 3, rx * 1.08, ry * 1.08, seed + 3, 11)
  ctx.fill()
  const g = ctx.createLinearGradient(cx, cy - ry, cx, cy + ry)
  g.addColorStop(0, '#4a7a82')
  g.addColorStop(0.35, '#245860')
  g.addColorStop(1, '#132e34')
  ctx.fillStyle = g
  noisyBlob(ctx, cx, cy, rx, ry, seed + 9, 11)
  ctx.fill()
  ctx.save()
  noisyBlob(ctx, cx, cy, rx, ry, seed + 9, 11)
  ctx.clip()
  ctx.fillStyle = `rgba(244,231,207,${0.12 + 0.05 * Math.sin(now / 680)})`
  ctx.fillRect(cx - rx, cy - ry * 0.72, rx * 2, ry * 0.42)
  ctx.strokeStyle = 'rgba(180,220,230,0.22)'
  ctx.lineWidth = 1
  for (let i = 0; i < 3; i++) {
    ctx.beginPath()
    const y = cy - 6 + i * 8 + Math.sin(now / 340 + i) * 1.8
    ctx.moveTo(cx - rx * 0.62, y)
    ctx.quadraticCurveTo(cx, y + 4, cx + rx * 0.62, y)
    ctx.stroke()
  }
  ctx.restore()
  ctx.strokeStyle = '#5a3a22'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI + 0.4
    const bx = cx + Math.cos(a) * rx * 0.92
    const by = cy + Math.sin(a) * ry * 0.7
    ctx.beginPath()
    ctx.moveTo(bx, by)
    ctx.lineTo(bx + (hash01(seed + i) - 0.5) * 6, by - 10 - hash01(seed + i * 2) * 8)
    ctx.stroke()
  }
}

function drawHouse(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.fillStyle = '#2a1c12'
  ctx.fillRect(x - s * 0.55, y + s * 0.22, s * 1.1, s * 0.1)
  ctx.fillStyle = '#e8d4b0'
  ctx.fillRect(x - s * 0.36, y - s * 0.02, s * 0.72, s * 0.42)
  ctx.fillStyle = '#6b3f22'
  ctx.beginPath()
  ctx.moveTo(x - s * 0.48, y)
  ctx.lineTo(x, y - s * 0.55)
  ctx.lineTo(x + s * 0.48, y)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = '#3a2414'
  ctx.lineWidth = Math.max(1.2, s * 0.04)
  ctx.stroke()
  ctx.fillStyle = '#1a120c'
  ctx.fillRect(x - s * 0.08, y + s * 0.12, s * 0.16, s * 0.28)
  ctx.fillStyle = `${BRASA2}aa`
  ctx.fillRect(x + s * 0.12, y + s * 0.06, s * 0.14, s * 0.12)
  ctx.fillStyle = '#4a3424'
  ctx.fillRect(x + s * 0.38, y + s * 0.02, s * 0.12, s * 0.38)
}

function drawCorral(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  const w = s * 1.05
  const h = s * 0.72
  ctx.strokeStyle = TIERRA2
  ctx.lineWidth = Math.max(2, s * 0.06)
  ctx.lineCap = 'round'
  for (let i = 0; i < 5; i++) {
    const px = x - w / 2 + (i * w) / 4
    ctx.beginPath()
    ctx.moveTo(px, y - h / 2)
    ctx.lineTo(px, y + h / 2)
    ctx.stroke()
  }
  ctx.strokeStyle = '#c99052'
  ctx.lineWidth = Math.max(1.6, s * 0.05)
  for (const k of [-0.28, 0, 0.28]) {
    ctx.beginPath()
    ctx.moveTo(x - w / 2, y + h * k)
    ctx.lineTo(x + w / 2, y + h * k)
    ctx.stroke()
  }
  ctx.fillStyle = '#3a2a1c'
  ctx.fillRect(x - s * 0.22, y + h * 0.18, s * 0.44, s * 0.12)
}

function drawAsset(ctx: CanvasRenderingContext2D, layout: GridLayout, inc: Incident, now: number, live: boolean, reduced: boolean) {
  const { x, y, w, h, s } = cellRect(layout, inc.focus.c, inc.focus.r)
  const cx = x + w / 2
  const cy = y + h / 2
  const pulse = live && !reduced ? 1 + 0.03 * Math.sin(now / 140) : 1
  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(pulse, pulse)
  if (inc.kind === 'house') drawHouse(ctx, 0, 0, s * 1.65)
  else if (inc.kind === 'water') {
    ctx.fillStyle = CREMA
    ctx.fillRect(-s * 0.2, -s * 0.28, s * 0.4, s * 0.34)
    ctx.fillStyle = '#2a5560'
    ctx.beginPath()
    ctx.moveTo(-s * 0.24, -s * 0.28)
    ctx.lineTo(0, -s * 0.5)
    ctx.lineTo(s * 0.24, -s * 0.28)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#1a3340'
    ctx.fillRect(-s * 0.09, s * 0.02, s * 0.18, s * 0.2)
  } else drawCorral(ctx, 0, 0, s * 1.55)
  ctx.restore()
}

function drawNode(ctx: CanvasRenderingContext2D, layout: GridLayout, world: World, now: number, hint: boolean, grabAt: number, reduced: boolean) {
  const { x, y, w, h, s } = cellRect(layout, world.node.c, world.node.r)
  const cx = x + w / 2
  const cy = y + h / 2
  const grab = grabAt > 0 && now - grabAt < 180 ? 1.25 - ((now - grabAt) / 180) * 0.35 : hint ? 1.08 : 0.95
  const rad = s * grab
  const halo = ctx.createRadialGradient(cx, cy, 2, cx, cy, rad * 1.8)
  halo.addColorStop(0, `${AURA}66`)
  halo.addColorStop(1, 'rgba(25,195,125,0)')
  ctx.fillStyle = halo
  ctx.beginPath()
  ctx.arc(cx, cy, rad * 1.8, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = AURA
  ctx.beginPath()
  ctx.arc(cx, cy, rad, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = CREMA
  ctx.beginPath()
  ctx.arc(cx, cy, rad * 0.34, 0, Math.PI * 2)
  ctx.fill()
  if (hint && !reduced) {
    ctx.strokeStyle = `${AURA}aa`
    ctx.lineWidth = 2.4
    ctx.beginPath()
    ctx.arc(cx, cy, rad * (1.35 + 0.12 * Math.sin(now / 200)), 0, Math.PI * 2)
    ctx.stroke()
  }
  if (hint) {
    ctx.save()
    ctx.textAlign = 'center'
    ctx.font = `700 ${Math.max(11, s * 0.42)}px ui-monospace, monospace`
    ctx.lineWidth = 4
    ctx.strokeStyle = 'rgba(13,18,16,0.7)'
    ctx.strokeText('BASE', cx, cy - rad * 1.62)
    ctx.fillStyle = CREMA
    ctx.fillText('BASE', cx, cy - rad * 1.62)
    ctx.restore()
  }
}

function drawFocusTarget(ctx: CanvasRenderingContext2D, layout: GridLayout, inc: Incident, now: number, reduced: boolean) {
  const { x, y, w, h, s } = cellRect(layout, inc.focus.c, inc.focus.r)
  const cx = x + w / 2
  const cy = y + h / 2
  const beat = reduced ? 0 : Math.sin(now / 180) * 0.09
  const r = s * (1.2 + beat)
  ctx.save()
  ctx.strokeStyle = CREMA
  ctx.lineWidth = Math.max(2.5, s * 0.08)
  ctx.setLineDash([Math.max(5, s * 0.25), Math.max(4, s * 0.18)])
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.strokeStyle = BRASA2
  ctx.lineWidth = Math.max(2, s * 0.055)
  ctx.beginPath()
  ctx.arc(cx, cy, r + s * 0.2, 0, Math.PI * 2)
  ctx.stroke()
  ctx.textAlign = 'center'
  ctx.font = `700 ${Math.max(11, s * 0.42)}px ui-monospace, monospace`
  ctx.lineWidth = 4
  ctx.strokeStyle = 'rgba(13,18,16,0.76)'
  ctx.strokeText('SOLTÁ AQUÍ', cx, cy - r - s * 0.5)
  ctx.fillStyle = CREMA
  ctx.fillText('SOLTÁ AQUÍ', cx, cy - r - s * 0.5)
  ctx.restore()
}

function drawFire(
  ctx: CanvasRenderingContext2D,
  layout: GridLayout,
  world: World,
  t: number,
  now: number,
  saved: Set<string>,
  cleared: Set<number>,
  activeId: number | null,
  reduced: boolean,
  telegraph: boolean,
) {
  const clockNow = clock(now, reduced)
  for (const inc of world.incidents) {
    if (cleared.has(inc.id)) continue
    const showThreat = telegraph ? inc.id === 0 : t >= inc.appearMs || (t === 0 && inc.id === 0)
    if (!showThreat && t < inc.appearMs) continue
    const live = activeId === inc.id || (telegraph && inc.id === 0)
    const { x, y, w, h, s } = cellRect(layout, inc.focus.c, inc.focus.r)
    const cx = x + w / 2
    const cy = y + h / 2

    if (t >= inc.appearMs) {
      const burn: Point[] = []
      for (let r = inc.focus.r - inc.radius - 1; r <= inc.focus.r + inc.radius + 1; r++) {
        for (let c = inc.focus.c - inc.radius - 1; c <= inc.focus.c + inc.radius + 1; c++) {
          if (c < 0 || r < 0 || c >= COLS || r >= ROWS) continue
          if (saved.has(`${c},${r}`)) continue
          if (fireTimeMs(inc, { c, r }) > t) continue
          const cell = cellRect(layout, c, r)
          burn.push({ x: cell.x + cell.w / 2, y: cell.y + cell.h / 2 })
        }
      }
      if (burn.length) {
        let ax = 0
        let ay = 0
        for (const p of burn) {
          ax += p.x
          ay += p.y
        }
        ax /= burn.length
        ay /= burn.length
        const spread = Math.sqrt(burn.length) * layout.cell * 0.55
        ctx.fillStyle = live ? 'rgba(255,90,54,0.38)' : 'rgba(180,70,40,0.28)'
        fillEllipse(ctx, ax, ay, spread * 1.2, spread * 0.82)
        ctx.fillStyle = live ? 'rgba(255,159,28,0.48)' : 'rgba(200,90,40,0.24)'
        fillEllipse(ctx, ax, ay - spread * 0.14, spread * 0.72, spread * 0.48)
      }
    }

    const halo = s * (live ? 2.1 : 1.35)
    const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, halo)
    g.addColorStop(0, `${BRASA}cc`)
    g.addColorStop(0.45, `${BRASA2}66`)
    g.addColorStop(1, 'rgba(255,90,54,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(cx, cy, halo, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = BRASA
    noisyBlob(ctx, cx, cy - s * 0.1, s * 0.42, s * (0.7 + (live && !reduced ? 0.08 * Math.sin(clockNow / 80) : 0)), inc.id * 21, 7)
    ctx.fill()
    ctx.fillStyle = BRASA2
    noisyBlob(ctx, cx, cy - s * 0.22, s * 0.18, s * 0.32, inc.id * 29, 6)
    ctx.fill()
    ctx.fillStyle = CREMA
    ctx.globalAlpha = 0.7
    noisyBlob(ctx, cx, cy - s * 0.3, s * 0.08, s * 0.14, inc.id * 31, 5)
    ctx.fill()
    ctx.globalAlpha = 1

    if (!reduced && live) {
      ctx.fillStyle = 'rgba(210,210,210,0.2)'
      for (let i = 0; i < 4; i++) {
        const u = (clockNow / 900 + i * 0.2 + inc.id) % 1
        noisyBlob(
          ctx,
          cx + world.wind.c * u * 28 + (hash01(i + inc.id) - 0.5) * 16,
          cy - 10 - u * 46,
          10 + u * 18,
          8 + u * 14,
          i * 5 + inc.id,
          6,
        )
        ctx.fill()
      }
    }
  }
}

function drawStrokePath(ctx: CanvasRenderingContext2D, layout: GridLayout, stroke: Stroke, color: string, width: number, dashed = false) {
  if (stroke.points.length < 2) return
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.strokeStyle = color
  ctx.lineWidth = width
  if (dashed) ctx.setLineDash([10, 12])
  ctx.beginPath()
  for (let i = 0; i < stroke.points.length; i++) {
    const p = worldToPx(layout, stroke.points[i]!)
    if (i === 0) ctx.moveTo(p.x, p.y)
    else ctx.lineTo(p.x, p.y)
  }
  ctx.stroke()
  ctx.setLineDash([])
}

function etaColor(eta: EtaBand | null): string {
  if (eta === 'green') return AURA
  if (eta === 'amber') return BRASA2
  if (eta === 'red') return BRASA
  return CREMA
}

function etaWord(eta: EtaBand | null): string {
  if (eta === 'green') return 'LLEGA'
  if (eta === 'amber') return 'JUSTO'
  if (eta === 'red') return 'TARDE'
  return ''
}

function drawEtaCapsule(ctx: CanvasRenderingContext2D, layout: GridLayout, stroke: Stroke, eta: EtaBand | null) {
  const last = stroke.points[stroke.points.length - 1]
  if (!last || !eta) return
  const p = worldToPx(layout, last)
  const label = etaWord(eta)
  const color = etaColor(eta)
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(p.x, p.y, Math.max(7, layout.cell * 0.22), 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = CREMA
  ctx.beginPath()
  ctx.arc(p.x, p.y, Math.max(3, layout.cell * 0.1), 0, Math.PI * 2)
  ctx.fill()

  ctx.font = `800 ${Math.max(13, Math.round(layout.cell * 0.42))}px Barlow Condensed, sans-serif`
  const tw = ctx.measureText(label).width
  const bw = tw + 16
  const bh = Math.max(22, layout.cell * 0.55)
  const bx = p.x - bw / 2
  const by = p.y - bh - 12
  ctx.fillStyle = NIGHT
  ctx.beginPath()
  ctx.roundRect(bx, by, bw, bh, 10)
  ctx.fill()
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, p.x, by + bh / 2)
}

function drawForeground(ctx: CanvasRenderingContext2D, w: number, h: number, layout: GridLayout, seed: number) {
  const y0 = layout.oy + layout.gridH - 22
  const g = ctx.createLinearGradient(0, y0, 0, h)
  g.addColorStop(0, 'rgba(13,18,16,0)')
  g.addColorStop(1, 'rgba(10,14,12,0.38)')
  ctx.fillStyle = g
  ctx.fillRect(0, y0, w, h - y0)
  ctx.fillStyle = '#1a2416'
  for (let i = 0; i < 9; i++) {
    const x = (i / 8) * w + (hash01(seed + i) - 0.5) * 18
    fillEllipse(ctx, x, h - 10, 18 + hash01(seed + i * 3) * 22, 7 + hash01(seed + i * 5) * 6)
  }
}

export function drawFrame(ctx: CanvasRenderingContext2D, w: number, h: number, opts: DrawOpts) {
  const { layout, world } = opts
  const shake = opts.reduced ? 0 : Math.min(2.2, opts.shake)
  const grabAt = opts.grabAt ?? 0
  ctx.save()
  ctx.translate(shake ? (hash01(opts.now * 0.08) - 0.5) * shake : 0, shake ? (hash01(opts.now * 0.11) - 0.5) * shake : 0)
  drawSky(ctx, w, h, opts.clutch, opts.now, opts.reduced)

  if (!world) {
    ctx.restore()
    return
  }

  drawTerrain(ctx, w, h, layout, world, opts.now, opts.reduced)

  const savedKey = new Set(opts.saved.map((cell) => `${cell.c},${cell.r}`))
  const cleared = opts.cleared ?? new Set<number>()
  const active = opts.phase === 'play' ? incidentAt(opts.t, world) : world.incidents[0] ?? null
  const telegraph = opts.phase === 'ready' || (opts.phase === 'play' && opts.t < world.incidents[0]!.appearMs)
  drawFire(ctx, layout, world, opts.phase === 'ready' ? world.incidents[0]!.appearMs : opts.t, opts.now, savedKey, cleared, active?.id ?? null, opts.reduced, telegraph)

  for (const cell of opts.ghost) {
    void cell
  }
  if (opts.ghost.length && world) {
    const focus = (opts.drawing && world.incidents[opts.drawing.incident]?.focus) || world.incidents[0]!.focus
    const { x, y, w, h } = cellRect(layout, focus.c, focus.r)
    const wash = ctx.createRadialGradient(x + w / 2, y + h / 2, 8, x + w / 2, y + h / 2, layout.cell * 3.2)
    wash.addColorStop(0, `${etaColor(opts.eta)}55`)
    wash.addColorStop(1, 'rgba(25,195,125,0)')
    ctx.fillStyle = wash
    ctx.beginPath()
    ctx.arc(x + w / 2, y + h / 2, layout.cell * 3.2, 0, Math.PI * 2)
    ctx.fill()
  }

  if (opts.saved.length) {
    let ax = 0
    let ay = 0
    let n = 0
    for (const cell of opts.saved) {
      const age = opts.now - cell.born - cell.delay
      if (age < 0) continue
      const { x, y, w: cw, h: ch } = cellRect(layout, cell.c, cell.r)
      ax += x + cw / 2
      ay += y + ch / 2
      n++
    }
    if (n) {
      const wash = ctx.createRadialGradient(ax / n, ay / n, 8, ax / n, ay / n, layout.cell * 3.4)
      wash.addColorStop(0, `${AURA}55`)
      wash.addColorStop(1, 'rgba(25,195,125,0)')
      ctx.fillStyle = wash
      ctx.beginPath()
      ctx.arc(ax / n, ay / n, layout.cell * 3.4, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const readyGuide =
    opts.phase === 'ready'
      ? firstGuidePath(world).map(normOfCell)
      : opts.guide
  if (readyGuide.length > 1) {
    ctx.setLineDash([8, 10])
    ctx.strokeStyle = `${AURA}aa`
    ctx.lineWidth = 4
    ctx.beginPath()
    readyGuide.forEach((p, i) => {
      const px = worldToPx(layout, p)
      if (i === 0) ctx.moveTo(px.x, px.y)
      else ctx.lineTo(px.x, px.y)
    })
    ctx.stroke()
    ctx.setLineDash([])
    const tip = worldToPx(layout, readyGuide[readyGuide.length - 1]!)
    ctx.fillStyle = AURA
    ctx.beginPath()
    ctx.moveTo(tip.x, tip.y - 8)
    ctx.lineTo(tip.x + 6, tip.y + 4)
    ctx.lineTo(tip.x - 6, tip.y + 4)
    ctx.closePath()
    ctx.fill()
  }

  drawNode(ctx, layout, world, opts.now, opts.hint || opts.canAct || opts.phase === 'ready', grabAt, opts.reduced)
  for (const inc of world.incidents) {
    const live = active?.id === inc.id || opts.phase !== 'play' || (telegraph && inc.id === 0)
    if (opts.phase === 'play' && opts.t < inc.appearMs && inc.id !== 0) continue
    drawAsset(ctx, layout, inc, opts.now, live, opts.reduced)
  }
  if (active && opts.canAct && !cleared.has(active.id)) {
    drawFocusTarget(ctx, layout, active, opts.now, opts.reduced)
  }

  for (const stroke of opts.strokes) {
    const inc = world.incidents[stroke.incident]
    if (!inc) continue
    const visualStroke = { ...stroke, points: guidePath(world, inc).map(normOfCell) }
    drawStrokePath(ctx, layout, visualStroke, `${AURA}99`, Math.max(8, layout.cell * 0.28))
    drawStrokePath(ctx, layout, visualStroke, CREMA, 2.2)
  }
  if (opts.drawing) {
    const color = etaColor(opts.eta)
    drawStrokePath(ctx, layout, opts.drawing, color, Math.max(9, layout.cell * 0.3))
    drawStrokePath(ctx, layout, opts.drawing, CREMA, 2.6)
    drawEtaCapsule(ctx, layout, opts.drawing, opts.eta)
  }

  if (opts.runner && opts.runner.points.length > 1) {
    const dur = 150
    const age = Math.min(1, (opts.now - opts.runner.born) / dur)
    const pts = opts.runner.points
    const i = Math.max(1, Math.floor(age * (pts.length - 1)))
    const p = worldToPx(layout, pts[i]!)
    ctx.fillStyle = AURA
    ctx.beginPath()
    ctx.arc(p.x, p.y, 7, 0, Math.PI * 2)
    ctx.fill()
  }

  for (const shock of opts.shocks) {
    const u = (opts.now - shock.born) / 280
    if (u > 1) continue
    ctx.strokeStyle = shock.color
    ctx.globalAlpha = 1 - u
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(shock.x, shock.y, 8 + u * 42, 0, Math.PI * 2)
    ctx.stroke()
    ctx.globalAlpha = 1
  }

  for (const p of opts.particles) {
    ctx.globalAlpha = Math.max(0, p.life)
    ctx.fillStyle = p.color
    if (p.kind === 'smoke') {
      noisyBlob(ctx, p.x, p.y, p.size, p.size * 0.7, p.x, 6)
      ctx.fill()
    } else {
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.globalAlpha = 1

  for (const f of opts.floaters) {
    const u = (opts.now - f.born) / 1100
    ctx.globalAlpha = 1 - u
    ctx.fillStyle = f.color
    ctx.font = `800 ${Math.max(18, layout.cell * 0.7)}px Barlow Condensed, sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(f.text, f.x, f.y - u * 28)
  }
  ctx.globalAlpha = 1

  drawForeground(ctx, w, h, layout, world.seed)

  if (opts.flash > 0.04) {
    ctx.fillStyle =
      opts.flashTint === 'save'
        ? `rgba(25, 195, 125, ${opts.flash * 0.16})`
        : `rgba(255, 90, 54, ${opts.flash * 0.14})`
    ctx.fillRect(0, 0, w, h)
  }

  for (const j of opts.juice) {
    const u = (opts.now - j.born) / 900
    if (u > 1) continue
    ctx.globalAlpha = 1 - u
    ctx.fillStyle = j.color
    ctx.font = `800 ${20 + (j.scale ?? 1) * 10}px Barlow Condensed, sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(j.label, layout.ox + layout.gridW / 2, layout.oy + 28)
  }
  ctx.globalAlpha = 1
  ctx.restore()
  void assetCells
}
