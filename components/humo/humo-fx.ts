import {
  COLS,
  ROWS,
  TERRAIN,
  assetCells,
  fireTimeMs,
  incidentAt,
  type Cell,
  type EtaBand,
  type Incident,
  type Stroke,
  type Terrain,
  type World,
} from '@/lib/humo/sim'

export type Juice = { label: string; color: string; born: number; scale?: number }
export type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number }
export type Floater = { text: string; x: number; y: number; born: number; color: string }
export type SavedCell = Cell & { born: number; delay: number }
export type Shock = { x: number; y: number; born: number; color: string }
export type FlashTint = 'save' | 'miss' | 'fire'
export type GridLayout = { ox: number; oy: number; cell: number; gridW: number; gridH: number }

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
  guide: { x: number; y: number }[]
  runner: { points: { x: number; y: number }[]; born: number } | null
  eta: EtaBand | null
  reduced: boolean
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

export function hash01(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

export function gridLayout(w: number, h: number): GridLayout {
  const wide = w > h * 1.05
  const padTop = wide ? Math.max(24, h * 0.06) : Math.max(72, Math.min(110, h * 0.12))
  const padBot = wide ? Math.max(24, h * 0.08) : Math.max(88, Math.min(128, h * 0.16))
  const padX = wide ? w * 0.06 : Math.max(10, w * 0.04)
  const availW = wide ? Math.max(32, w * 0.62) : Math.max(32, w - padX * 2)
  const availH = Math.max(32, h - padTop - padBot)
  const cell = Math.max(8, Math.min(availW / COLS, availH / ROWS))
  const gridW = cell * COLS
  const gridH = cell * ROWS
  return {
    ox: wide ? w - padX - gridW : (w - gridW) / 2,
    oy: padTop + Math.max(0, availH - gridH) / 2,
    cell,
    gridW,
    gridH,
  }
}

export function cellRect(layout: GridLayout, c: number, r: number) {
  return { x: layout.ox + c * layout.cell, y: layout.oy + r * layout.cell, s: layout.cell }
}

export function spawnBurst(x: number, y: number, color: string, n: number, speed = 0.9): Particle[] {
  const out: Particle[] = []
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * Math.PI * 2 + hash01(i + x) * 0.4
    const sp = speed * (0.35 + hash01(i * 3 + y) * 0.9)
    out.push({
      x,
      y,
      vx: Math.cos(ang) * sp,
      vy: Math.sin(ang) * sp,
      life: 1,
      color,
      size: 1.6 + hash01(i * 9) * 2.4,
    })
  }
  return out
}

export function spawnWind(layout: GridLayout, world: World, now: number): Particle[] {
  const out: Particle[] = []
  for (let i = 0; i < 10; i++) {
    const u = (now / 900 + i * 0.11) % 1
    out.push({
      x: layout.ox + ((0.08 + hash01(i * 4) * 0.84 + world.wind.c * u * 0.2) * layout.gridW),
      y: layout.oy + ((0.1 + hash01(i * 7) * 0.8 + world.wind.r * u * 0.2) * layout.gridH),
      vx: world.wind.c * 1.4,
      vy: world.wind.r * 1.4,
      life: 0.55,
      color: CREMA,
      size: 1.2,
    })
  }
  return out
}

export function stepParticles(particles: Particle[]): Particle[] {
  for (const p of particles) {
    p.x += p.vx
    p.y += p.vy
    p.vy -= 0.012
    p.life -= 0.028
  }
  return particles.filter((p) => p.life > 0)
}

function roundCell(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, jitter: number) {
  const r = Math.max(2, s * 0.22)
  ctx.beginPath()
  ctx.roundRect(x - jitter, y - jitter * 0.4, s + jitter * 2, s + jitter, r)
}

function drawSky(ctx: CanvasRenderingContext2D, w: number, h: number, clutch: boolean) {
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, '#152018')
  g.addColorStop(0.42, NIGHT)
  g.addColorStop(1, clutch ? '#1a100c' : '#14110c')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
}

function drawTerrain(ctx: CanvasRenderingContext2D, layout: GridLayout, world: World, now: number) {
  ctx.fillStyle = '#1a140e'
  ctx.beginPath()
  ctx.roundRect(layout.ox - 10, layout.oy - 10, layout.gridW + 20, layout.gridH + 20, 18)
  ctx.fill()

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const ter = world.terrain[r * COLS + c] as Terrain
      const { x, y, s } = cellRect(layout, c, r)
      const j = (hash01(c * 13 + r * 9) - 0.5) * s * 0.18
      if (ter === TERRAIN.water) {
        ctx.fillStyle = `rgba(36, 78, 92, ${0.72 + 0.1 * Math.sin(now / 400 + c)})`
        ctx.beginPath()
        ctx.ellipse(x + s / 2, y + s / 2, s * 0.62, s * 0.5, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = 'rgba(180, 220, 230, 0.22)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(x + 2, y + s * 0.45 + Math.sin(now / 280 + c) * 2)
        ctx.lineTo(x + s - 2, y + s * 0.5)
        ctx.stroke()
        continue
      }
      if (ter === TERRAIN.monte) {
        ctx.fillStyle = hash01(c + r) > 0.5 ? MONTE : '#1c2e20'
        ctx.beginPath()
        ctx.arc(x + s * 0.5 + j, y + s * 0.55, s * (0.42 + hash01(c * 3) * 0.16), 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = MONTE2
        ctx.beginPath()
        ctx.arc(x + s * 0.38, y + s * 0.42, s * 0.2, 0, Math.PI * 2)
        ctx.fill()
        continue
      }
      if (ter === TERRAIN.path) {
        ctx.fillStyle = TIERRA
        roundCell(ctx, x + s * 0.12, y + s * 0.12, s * 0.76, j * 0.3)
        ctx.fill()
        ctx.fillStyle = `${TIERRA2}55`
        ctx.fillRect(x + s * 0.42, y + s * 0.18, s * 0.08, s * 0.64)
        continue
      }
      ctx.fillStyle = hash01(c * 2 + r) > 0.55 ? '#2f4a30' : '#334e32'
      roundCell(ctx, x, y, s, j)
      ctx.fill()
      if (ter === TERRAIN.field) {
        ctx.strokeStyle = 'rgba(201, 144, 82, 0.16)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(x + 2, y + s * 0.4)
        ctx.lineTo(x + s - 2, y + s * 0.55)
        ctx.stroke()
      }
    }
  }
}

function drawAsset(ctx: CanvasRenderingContext2D, layout: GridLayout, inc: Incident, now: number, live: boolean) {
  const { x, y, s } = cellRect(layout, inc.focus.c, inc.focus.r)
  const pulse = live ? 1 + 0.04 * Math.sin(now / 120) : 1
  ctx.save()
  ctx.translate(x + s / 2, y + s / 2)
  ctx.scale(pulse, pulse)
  if (inc.kind === 'house') {
    ctx.fillStyle = CREMA
    ctx.fillRect(-s * 0.34, -s * 0.08, s * 0.68, s * 0.42)
    ctx.fillStyle = TIERRA
    ctx.beginPath()
    ctx.moveTo(-s * 0.42, -s * 0.08)
    ctx.lineTo(0, -s * 0.48)
    ctx.lineTo(s * 0.42, -s * 0.08)
    ctx.fill()
  } else if (inc.kind === 'water') {
    ctx.fillStyle = '#2a5560'
    ctx.beginPath()
    ctx.ellipse(0, s * 0.08, s * 0.42, s * 0.28, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#6aa0aa'
    ctx.beginPath()
    ctx.ellipse(0, -s * 0.12, s * 0.18, s * 0.18, 0, 0, Math.PI * 2)
    ctx.fill()
  } else {
    ctx.strokeStyle = TIERRA2
    ctx.lineWidth = Math.max(2, s * 0.08)
    ctx.strokeRect(-s * 0.4, -s * 0.32, s * 0.8, s * 0.64)
    ctx.fillStyle = '#3a2a1c'
    ctx.fillRect(-s * 0.12, -s * 0.08, s * 0.22, s * 0.18)
  }
  ctx.restore()
}

function drawNode(ctx: CanvasRenderingContext2D, layout: GridLayout, world: World, now: number, hint: boolean) {
  const { x, y, s } = cellRect(layout, world.node.c, world.node.r)
  const cx = x + s / 2
  const cy = y + s / 2
  const rad = s * (hint ? 1.15 : 0.92)
  ctx.fillStyle = `${AURA}33`
  ctx.beginPath()
  ctx.arc(cx, cy, rad * 1.35, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = AURA
  ctx.beginPath()
  ctx.arc(cx, cy, rad, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = CREMA
  ctx.beginPath()
  ctx.arc(cx, cy, rad * 0.38, 0, Math.PI * 2)
  ctx.fill()
  if (hint) {
    ctx.strokeStyle = `${AURA}aa`
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(cx, cy, rad * (1.4 + 0.15 * Math.sin(now / 180)), 0, Math.PI * 2)
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
) {
  for (const inc of world.incidents) {
    if (t < inc.appearMs) continue
    const live = activeId === inc.id
    for (let r = inc.focus.r - inc.radius - 1; r <= inc.focus.r + inc.radius + 1; r++) {
      for (let c = inc.focus.c - inc.radius - 1; c <= inc.focus.c + inc.radius + 1; c++) {
        if (c < 0 || r < 0 || c >= COLS || r >= ROWS) continue
        if (saved.has(`${c},${r}`)) continue
        if (fireTimeMs(inc, { c, r }) > t) continue
        const { x, y, s } = cellRect(layout, c, r)
        const u = live ? 0.55 + 0.25 * Math.sin(now / 90 + c) : 0.42
        ctx.fillStyle = `rgba(255, 90, 54, ${u})`
        ctx.beginPath()
        ctx.arc(x + s / 2, y + s / 2, s * 0.42, 0, Math.PI * 2)
        ctx.fill()
        if (!reduced && live) {
          ctx.fillStyle = `${BRASA2}cc`
          ctx.beginPath()
          ctx.arc(x + s * 0.45, y + s * 0.35, s * 0.16, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }
    const { x, y, s } = cellRect(layout, inc.focus.c, inc.focus.r)
    const halo = s * (live ? 1.8 : 1.2)
    const g = ctx.createRadialGradient(x + s / 2, y + s / 2, 2, x + s / 2, y + s / 2, halo)
    g.addColorStop(0, `${BRASA}cc`)
    g.addColorStop(1, 'rgba(255,90,54,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x + s / 2, y + s / 2, halo, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawStrokePath(
  ctx: CanvasRenderingContext2D,
  layout: GridLayout,
  stroke: Stroke,
  color: string,
  width: number,
) {
  if (stroke.points.length < 2) return
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.beginPath()
  for (let i = 0; i < stroke.points.length; i++) {
    const p = stroke.points[i]!
    const x = layout.ox + p.x * layout.gridW
    const y = layout.oy + p.y * layout.gridH
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()
}

function etaColor(eta: EtaBand | null): string {
  if (eta === 'green') return AURA
  if (eta === 'amber') return BRASA2
  if (eta === 'red') return BRASA
  return CREMA
}

export function drawFrame(ctx: CanvasRenderingContext2D, w: number, h: number, opts: DrawOpts) {
  const { layout, world } = opts
  const shake = opts.reduced ? 0 : Math.min(2.2, opts.shake)
  ctx.save()
  ctx.translate(shake ? (hash01(opts.now * 0.08) - 0.5) * shake : 0, shake ? (hash01(opts.now * 0.11) - 0.5) * shake : 0)
  drawSky(ctx, w, h, opts.clutch)

  if (!world) {
    ctx.restore()
    return
  }

  drawTerrain(ctx, layout, world, opts.now)

  const savedKey = new Set(opts.saved.map((cell) => `${cell.c},${cell.r}`))
  const active = incidentAt(opts.t, world)
  drawFire(ctx, layout, world, opts.t, opts.now, savedKey, active?.id ?? null, opts.reduced)

  for (const cell of opts.ghost) {
    const { x, y, s } = cellRect(layout, cell.c, cell.r)
    ctx.fillStyle = `${etaColor(opts.eta)}55`
    ctx.beginPath()
    ctx.arc(x + s / 2, y + s / 2, s * 0.28, 0, Math.PI * 2)
    ctx.fill()
  }

  for (const cell of opts.saved) {
    const age = opts.now - cell.born - cell.delay
    if (age < 0) continue
    const { x, y, s } = cellRect(layout, cell.c, cell.r)
    ctx.fillStyle = `${AURA}66`
    ctx.beginPath()
    ctx.arc(x + s / 2, y + s / 2, s * 0.3, 0, Math.PI * 2)
    ctx.fill()
  }

  if (opts.guide.length > 1) {
    ctx.setLineDash([8, 10])
    ctx.strokeStyle = `${AURA}99`
    ctx.lineWidth = 3
    ctx.beginPath()
    opts.guide.forEach((p, i) => {
      const x = layout.ox + p.x * layout.gridW
      const y = layout.oy + p.y * layout.gridH
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()
    ctx.setLineDash([])
  }

  drawNode(ctx, layout, world, opts.now, opts.hint || opts.canAct)
  for (const inc of world.incidents) {
    drawAsset(ctx, layout, inc, opts.now, active?.id === inc.id || opts.phase !== 'play')
  }

  for (const stroke of opts.strokes) {
    drawStrokePath(ctx, layout, stroke, `${AURA}99`, 7)
    drawStrokePath(ctx, layout, stroke, CREMA, 2.2)
  }
  if (opts.drawing) {
    const color = etaColor(opts.eta)
    drawStrokePath(ctx, layout, opts.drawing, color, 8)
    drawStrokePath(ctx, layout, opts.drawing, CREMA, 2.4)
  }

  if (opts.runner && opts.runner.points.length > 1) {
    const age = Math.min(1, (opts.now - opts.runner.born) / 520)
    const pts = opts.runner.points
    const i = Math.max(1, Math.floor(age * (pts.length - 1)))
    const p = pts[i]!
    ctx.fillStyle = AURA
    ctx.beginPath()
    ctx.arc(layout.ox + p.x * layout.gridW, layout.oy + p.y * layout.gridH, 6, 0, Math.PI * 2)
    ctx.fill()
  }

  for (const p of opts.particles) {
    ctx.globalAlpha = Math.max(0, p.life)
    ctx.fillStyle = p.color
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  for (const f of opts.floaters) {
    const u = (opts.now - f.born) / 1100
    ctx.globalAlpha = 1 - u
    ctx.fillStyle = f.color
    ctx.font = `800 ${Math.max(18, layout.cell * 0.9)}px ${typeof window === 'undefined' ? 'sans-serif' : getComputedStyle(document.body).fontFamily}`
    ctx.textAlign = 'center'
    ctx.fillText(f.text, f.x, f.y - u * 28)
  }
  ctx.globalAlpha = 1

  if (opts.flash > 0.04) {
    ctx.fillStyle =
      opts.flashTint === 'save'
        ? `rgba(25, 195, 125, ${opts.flash * 0.18})`
        : `rgba(255, 90, 54, ${opts.flash * 0.16})`
    ctx.fillRect(0, 0, w, h)
  }

  for (const j of opts.juice) {
    const u = (opts.now - j.born) / 900
    if (u > 1) continue
    ctx.globalAlpha = 1 - u
    ctx.fillStyle = j.color
    ctx.font = `800 ${22 + (j.scale ?? 1) * 8}px sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(j.label, w / 2, layout.oy - 12)
  }
  ctx.globalAlpha = 1
  ctx.restore()
}

void assetCells
