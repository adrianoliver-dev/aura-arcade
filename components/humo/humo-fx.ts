import {
  COLS,
  ROWS,
  TERRAIN,
  assetCells,
  fireTimeMs,
  firstGuidePath,
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
  dayGhost?: Point[]
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
  const portrait = h >= w * 0.92
  if (portrait) {
    const padX = Math.max(6, w * 0.018)
    const gridW = w - padX * 2
    const gridH = Math.min(h * 0.72, Math.max(h * 0.62, h * 0.68))
    const sky = Math.max(48, h * 0.11)
    const leftover = h - sky - gridH
    const oy = sky + leftover * 0.12
    const cellW = gridW / COLS
    const cellH = gridH / ROWS
    return { ox: padX, oy, cell: Math.min(cellW, cellH), cellW, cellH, gridW, gridH }
  }
  const padY = Math.max(16, h * 0.045)
  const padX = Math.max(24, w * 0.07)
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

function drawSky(ctx: CanvasRenderingContext2D, w: number, h: number, clutch: boolean, now: number, reduced: boolean) {
  const t = clock(now, reduced)
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, clutch ? '#2a1810' : '#1c261c')
  g.addColorStop(0.18, clutch ? '#24140e' : '#152018')
  g.addColorStop(0.45, NIGHT)
  g.addColorStop(1, clutch ? '#1a100c' : '#12100c')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)

  const sunX = w * 0.78
  const sunY = h * 0.08
  const sun = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, Math.max(w, h) * 0.28)
  sun.addColorStop(0, `rgba(255,159,28,${clutch ? 0.28 : 0.16})`)
  sun.addColorStop(1, 'rgba(255,90,54,0)')
  ctx.fillStyle = sun
  ctx.fillRect(0, 0, w, h * 0.42)

  ctx.fillStyle = '#1a241c'
  ctx.beginPath()
  ctx.moveTo(0, h * 0.2)
  for (let i = 0; i <= 8; i++) {
    const x = (i / 8) * w
    const y = h * (0.13 + hash01(i * 4.2) * 0.07 + Math.sin(t / 9000 + i) * 0.004)
    ctx.lineTo(x, y)
  }
  ctx.lineTo(w, h * 0.28)
  ctx.lineTo(0, h * 0.28)
  ctx.fill()
}

function predioEdge(ctx: CanvasRenderingContext2D, layout: GridLayout, seed: number) {
  const { ox, oy, gridW, gridH } = layout
  ctx.beginPath()
  const n = 18
  for (let i = 0; i <= n; i++) {
    const u = i / n
    const x = ox + u * gridW + (hash01(seed + i) - 0.5) * 6
    const y = oy + (hash01(seed * 3 + i) - 0.5) * 5
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  for (let i = 1; i <= n; i++) {
    const u = i / n
    ctx.lineTo(ox + gridW + (hash01(seed + 40 + i) - 0.5) * 5, oy + u * gridH)
  }
  for (let i = 1; i <= n; i++) {
    const u = i / n
    ctx.lineTo(ox + gridW - u * gridW, oy + gridH + (hash01(seed + 80 + i) - 0.5) * 6)
  }
  for (let i = 1; i <= n; i++) {
    const u = i / n
    ctx.lineTo(ox + (hash01(seed + 120 + i) - 0.5) * 5, oy + gridH - u * gridH)
  }
  ctx.closePath()
}

function drawTerrain(ctx: CanvasRenderingContext2D, layout: GridLayout, world: World, now: number, reduced: boolean) {
  const t = clock(now, reduced)
  predioEdge(ctx, layout, world.seed)
  ctx.save()
  ctx.clip()
  const soil = ctx.createLinearGradient(layout.ox, layout.oy, layout.ox, layout.oy + layout.gridH)
  soil.addColorStop(0, '#4a3320')
  soil.addColorStop(0.45, '#3a2718')
  soil.addColorStop(1, '#2c1d12')
  ctx.fillStyle = soil
  ctx.fillRect(layout.ox, layout.oy, layout.gridW, layout.gridH)

  ctx.fillStyle = 'rgba(78,56,34,0.35)'
  for (let i = 0; i < 18; i++) {
    const x = layout.ox + hash01(world.seed + i) * layout.gridW
    const y = layout.oy + hash01(world.seed + i * 3) * layout.gridH
    noisyBlob(ctx, x, y, layout.cellW * (1.2 + hash01(i) * 2), layout.cellH * (0.8 + hash01(i * 2) * 1.4), world.seed + i, 7)
    ctx.fill()
  }

  ctx.strokeStyle = 'rgba(201,144,82,0.22)'
  ctx.lineWidth = 1
  for (let r = 0; r < ROWS; r++) {
    let run = 0
    for (let c = 0; c <= COLS; c++) {
      const isField = c < COLS && world.terrain[r * COLS + c] === TERRAIN.field
      if (isField) run++
      if ((!isField || c === COLS) && run > 1) {
        const start = c - run
        const a = cellRect(layout, start, r)
        const b = cellRect(layout, c - 1, r)
        ctx.beginPath()
        const y = a.y + a.h * (0.35 + hash01(r * 8) * 0.3)
        ctx.moveTo(a.x + 2, y)
        ctx.quadraticCurveTo((a.x + b.x + b.w) / 2, y + Math.sin(r) * 3, b.x + b.w - 2, y + 2)
        ctx.stroke()
        run = 0
      }
      if (!isField) run = 0
    }
  }

  const regions = regionsOf(world)
  for (const region of regions) {
    if (region.kind === TERRAIN.water) drawPond(ctx, layout, region.cells, t, world.seed)
    if (region.kind === TERRAIN.monte) drawCanopy(ctx, layout, region.cells, world.seed)
  }

  drawRoads(ctx, layout, world)
  ctx.restore()

  ctx.strokeStyle = 'rgba(13,18,16,0.55)'
  ctx.lineWidth = 3
  predioEdge(ctx, layout, world.seed)
  ctx.stroke()
}

function drawRoads(ctx: CanvasRenderingContext2D, layout: GridLayout, world: World) {
  const pts: Point[] = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (world.terrain[r * COLS + c] !== TERRAIN.path) continue
      pts.push({ x: layout.ox + (c + 0.5) * layout.cellW, y: layout.oy + (r + 0.5) * layout.cellH })
    }
  }
  if (pts.length < 2) return
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.strokeStyle = '#6d4526'
  ctx.lineWidth = Math.max(10, layout.cell * 0.72)
  strokeNearest(ctx, pts)
  ctx.strokeStyle = TIERRA
  ctx.lineWidth = Math.max(7, layout.cell * 0.52)
  strokeNearest(ctx, pts)
  ctx.strokeStyle = `${TIERRA2}66`
  ctx.lineWidth = 1.4
  strokeNearest(ctx, pts)
}

function strokeNearest(ctx: CanvasRenderingContext2D, pts: Point[]) {
  const used = new Set<number>()
  let cur = 0
  used.add(0)
  ctx.beginPath()
  ctx.moveTo(pts[0]!.x, pts[0]!.y)
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
    ctx.lineTo(pts[best]!.x, pts[best]!.y)
    cur = best
  }
  ctx.stroke()
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
  const rx = Math.max(layout.cellW * 1.6, Math.sqrt(cells.length) * layout.cellW * 0.7)
  const ry = Math.max(layout.cellH * 1.1, Math.sqrt(cells.length) * layout.cellH * 0.55)
  const g = ctx.createLinearGradient(cx, cy - ry, cx, cy + ry)
  g.addColorStop(0, '#3d6a74')
  g.addColorStop(0.45, '#24505c')
  g.addColorStop(1, '#16343c')
  ctx.fillStyle = g
  noisyBlob(ctx, cx, cy, rx, ry, seed + 9, 12)
  ctx.fill()
  ctx.save()
  noisyBlob(ctx, cx, cy, rx, ry, seed + 9, 12)
  ctx.clip()
  ctx.fillStyle = `rgba(244,231,207,${0.08 + 0.04 * Math.sin(now / 700)})`
  ctx.fillRect(cx - rx, cy - ry * 0.6, rx * 2, ry * 0.5)
  ctx.strokeStyle = 'rgba(180,220,230,0.28)'
  ctx.lineWidth = 1.2
  for (let i = 0; i < 3; i++) {
    ctx.beginPath()
    const y = cy - 4 + i * 7 + Math.sin(now / 320 + i) * 2
    ctx.moveTo(cx - rx * 0.7, y)
    ctx.quadraticCurveTo(cx, y + 3, cx + rx * 0.7, y)
    ctx.stroke()
  }
  ctx.restore()
  ctx.strokeStyle = 'rgba(201,144,82,0.35)'
  ctx.lineWidth = 2
  noisyBlob(ctx, cx, cy, rx, ry, seed + 9, 12)
  ctx.stroke()
}

function drawCanopy(ctx: CanvasRenderingContext2D, layout: GridLayout, cells: Cell[], seed: number) {
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
  const rx = Math.max(layout.cellW * 1.4, Math.sqrt(cells.length) * layout.cellW * 0.62)
  const ry = Math.max(layout.cellH * 1.1, Math.sqrt(cells.length) * layout.cellH * 0.52)
  ctx.fillStyle = '#172318'
  noisyBlob(ctx, cx, cy, rx, ry, seed + cells.length, 10)
  ctx.fill()
  const count = Math.max(2, Math.ceil(cells.length / 2.8))
  for (let i = 0; i < count; i++) {
    const cell = cells[Math.floor(hash01(seed + i * 11) * cells.length)]!
    const { x, y, w, h } = cellRect(layout, cell.c, cell.r)
    const bx = x + w * (0.3 + hash01(seed + i) * 0.4)
    const by = y + h * (0.35 + hash01(seed + i * 2) * 0.35)
    const brx = w * (0.95 + hash01(seed + i * 3) * 1.1)
    const bry = h * (0.8 + hash01(seed + i * 5) * 0.85)
    ctx.fillStyle = hash01(seed + i * 7) > 0.45 ? MONTE : '#1e3224'
    noisyBlob(ctx, bx, by, brx, bry, seed + i * 13, 8 + (i % 4))
    ctx.fill()
    ctx.fillStyle = `${MONTE2}aa`
    noisyBlob(ctx, bx - brx * 0.18, by - bry * 0.22, brx * 0.42, bry * 0.34, seed + i * 17, 7)
    ctx.fill()
  }
}

function drawHouse(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.fillStyle = '#2a1c12'
  ctx.fillRect(x - s * 0.48, y + s * 0.18, s * 0.96, s * 0.12)
  ctx.fillStyle = CREMA
  ctx.fillRect(x - s * 0.32, y - s * 0.06, s * 0.64, s * 0.4)
  ctx.fillStyle = '#6b3f22'
  ctx.beginPath()
  ctx.moveTo(x - s * 0.42, y - s * 0.06)
  ctx.lineTo(x, y - s * 0.52)
  ctx.lineTo(x + s * 0.42, y - s * 0.06)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#1a120c'
  ctx.fillRect(x - s * 0.06, y + s * 0.08, s * 0.14, s * 0.26)
  ctx.fillStyle = `${BRASA2}99`
  ctx.fillRect(x + s * 0.12, y + s * 0.02, s * 0.12, s * 0.1)
}

function drawCorral(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.strokeStyle = TIERRA2
  ctx.lineWidth = Math.max(2, s * 0.07)
  const w = s * 0.9
  const h = s * 0.7
  ctx.strokeRect(x - w / 2, y - h / 2, w, h)
  ctx.beginPath()
  ctx.moveTo(x - w / 2, y - h * 0.12)
  ctx.lineTo(x + w / 2, y - h * 0.12)
  ctx.moveTo(x - w / 2, y + h * 0.18)
  ctx.lineTo(x + w / 2, y + h * 0.18)
  ctx.stroke()
  ctx.fillStyle = '#3a2a1c'
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(x - w / 2 + (i * w) / 3 - s * 0.04, y - h / 2 - s * 0.04, s * 0.08, h + s * 0.08)
  }
}

function drawAsset(ctx: CanvasRenderingContext2D, layout: GridLayout, inc: Incident, now: number, live: boolean, reduced: boolean) {
  const { x, y, w, h, s } = cellRect(layout, inc.focus.c, inc.focus.r)
  const cx = x + w / 2
  const cy = y + h / 2
  const pulse = live && !reduced ? 1 + 0.03 * Math.sin(now / 140) : 1
  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(pulse, pulse)
  if (inc.kind === 'house') drawHouse(ctx, 0, 0, s * 1.15)
  else if (inc.kind === 'water') {
    /* pond already drawn; pump shed */
    ctx.fillStyle = CREMA
    ctx.fillRect(-s * 0.16, -s * 0.22, s * 0.32, s * 0.28)
    ctx.fillStyle = '#2a5560'
    ctx.fillRect(-s * 0.08, s * 0.02, s * 0.16, s * 0.18)
  } else drawCorral(ctx, 0, 0, s * 1.2)
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
}

function drawFire(
  ctx: CanvasRenderingContext2D,
  layout: GridLayout,
  world: World,
  t: number,
  now: number,
  saved: Set<string>,
  activeId: number | null,
  reduced: boolean,
  telegraph: boolean,
) {
  const clockNow = clock(now, reduced)
  for (const inc of world.incidents) {
    const showThreat = telegraph ? inc.id === 0 : t >= inc.appearMs || (t === 0 && inc.id === 0)
    if (!showThreat && t < inc.appearMs) continue
    const live = activeId === inc.id || (telegraph && inc.id === 0)
    const { x, y, w, h, s } = cellRect(layout, inc.focus.c, inc.focus.r)
    const cx = x + w / 2
    const cy = y + h / 2

    if (t >= inc.appearMs) {
      for (let r = inc.focus.r - inc.radius - 1; r <= inc.focus.r + inc.radius + 1; r++) {
        for (let c = inc.focus.c - inc.radius - 1; c <= inc.focus.c + inc.radius + 1; c++) {
          if (c < 0 || r < 0 || c >= COLS || r >= ROWS) continue
          if (saved.has(`${c},${r}`)) continue
          if (fireTimeMs(inc, { c, r }) > t) continue
          const cell = cellRect(layout, c, r)
          const u = live ? 0.5 + 0.2 * Math.sin(clockNow / 90 + c) : 0.38
          ctx.fillStyle = `rgba(255,90,54,${u})`
          noisyBlob(ctx, cell.x + cell.w / 2, cell.y + cell.h / 2, cell.w * 0.48, cell.h * 0.46, c * 9 + r, 6)
          ctx.fill()
        }
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

  drawTerrain(ctx, layout, world, opts.now, opts.reduced)

  const savedKey = new Set(opts.saved.map((cell) => `${cell.c},${cell.r}`))
  const active = opts.phase === 'play' ? incidentAt(opts.t, world) : world.incidents[0] ?? null
  const telegraph = opts.phase === 'ready' || (opts.phase === 'play' && opts.t < world.incidents[0]!.appearMs)
  drawFire(ctx, layout, world, opts.phase === 'ready' ? world.incidents[0]!.appearMs : opts.t, opts.now, savedKey, active?.id ?? null, opts.reduced, telegraph)

  if (opts.dayGhost && opts.dayGhost.length > 1 && opts.phase === 'play') {
    ctx.setLineDash([5, 8])
    ctx.strokeStyle = 'rgba(244,231,207,0.28)'
    ctx.lineWidth = 3
    ctx.beginPath()
    opts.dayGhost.forEach((p, i) => {
      const px = worldToPx(layout, p)
      if (i === 0) ctx.moveTo(px.x, px.y)
      else ctx.lineTo(px.x, px.y)
    })
    ctx.stroke()
    ctx.setLineDash([])
  }

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

  for (const cell of opts.saved) {
    const age = opts.now - cell.born - cell.delay
    if (age < 0) continue
    const { x, y, w: cw, h: ch } = cellRect(layout, cell.c, cell.r)
    ctx.fillStyle = `${AURA}55`
    ctx.fillRect(x, y, cw, ch)
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

  for (const stroke of opts.strokes) {
    drawStrokePath(ctx, layout, stroke, `${AURA}99`, Math.max(8, layout.cell * 0.28))
    drawStrokePath(ctx, layout, stroke, CREMA, 2.2)
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
