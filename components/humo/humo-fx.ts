import {
  COLS,
  ROWS,
  TERRAIN,
  assetCells,
  fireTimeMs,
  incidentAt,
  type Cell,
  type Incident,
  type Stroke,
  type Terrain,
  type World,
} from '@/lib/humo/sim'

export type Juice = {
  label: string
  color: string
  born: number
  scale?: number
}

export type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
  size: number
}

export type Floater = {
  text: string
  x: number
  y: number
  born: number
  color: string
}

export type SavedCell = Cell & { born: number; delay: number }

export type Shock = {
  x: number
  y: number
  born: number
  color: string
}

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
}

const TERRAIN_A: Record<number, string> = {
  [TERRAIN.path]: '#4A3F32',
  [TERRAIN.field]: '#1C2A18',
  [TERRAIN.monte]: '#0E1A12',
  [TERRAIN.water]: '#143044',
  [TERRAIN.shed]: '#3A2A20',
  [TERRAIN.house]: '#C9B8A0',
}

const TERRAIN_B: Record<number, string> = {
  [TERRAIN.path]: '#5A4C3C',
  [TERRAIN.field]: '#24351E',
  [TERRAIN.monte]: '#152218',
  [TERRAIN.water]: '#1A3C52',
  [TERRAIN.shed]: '#4A3428',
  [TERRAIN.house]: '#D4C4AC',
}

export function hash01(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

export function gridLayout(w: number, h: number): GridLayout {
  const padTop = Math.max(56, Math.min(100, h * 0.1))
  const padBot = Math.max(72, Math.min(120, h * 0.12))
  const padX = Math.max(8, w * 0.02)
  const availW = Math.max(32, w - padX * 2)
  const availH = Math.max(32, h - padTop - padBot)
  const cell = Math.max(4, Math.min(availW / COLS, availH / ROWS))
  const gridW = cell * COLS
  const gridH = cell * ROWS
  return {
    ox: (w - gridW) / 2,
    oy: padTop + Math.max(0, availH - gridH) / 2,
    cell,
    gridW,
    gridH,
  }
}

export function cellRect(layout: GridLayout, c: number, r: number) {
  return {
    x: layout.ox + c * layout.cell,
    y: layout.oy + r * layout.cell,
    s: layout.cell,
  }
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

export function stepParticles(particles: Particle[]): Particle[] {
  for (const p of particles) {
    p.x += p.vx
    p.y += p.vy
    p.vy -= 0.018
    p.life -= 0.024
  }
  return particles.filter((p) => p.life > 0)
}

function drawStars(ctx: CanvasRenderingContext2D, w: number, h: number, layout: GridLayout, now: number) {
  ctx.fillStyle = '#07080C'
  ctx.fillRect(-20, -20, w + 40, h + 40)
  for (let i = 0; i < 48; i++) {
    const sx = hash01(i * 19 + 3) * w
    const sy = hash01(i * 23 + 7) * h
    if (
      sx > layout.ox - 8 &&
      sx < layout.ox + layout.gridW + 8 &&
      sy > layout.oy - 8 &&
      sy < layout.oy + layout.gridH + 8
    ) {
      continue
    }
    const twinkle = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(now / 400 + i))
    ctx.globalAlpha = twinkle
    ctx.fillStyle = i % 7 === 0 ? '#F2A021' : '#E8E4FF'
    ctx.fillRect(sx, sy, i % 5 === 0 ? 2 : 1.2, i % 5 === 0 ? 2 : 1.2)
  }
  ctx.globalAlpha = 1
}

function drawTerrain(ctx: CanvasRenderingContext2D, layout: GridLayout, world: World, now: number) {
  ctx.fillStyle = '#0B120E'
  ctx.fillRect(layout.ox - 4, layout.oy - 4, layout.gridW + 8, layout.gridH + 8)
  ctx.strokeStyle = 'rgba(242, 160, 33, 0.18)'
  ctx.lineWidth = 2
  ctx.strokeRect(layout.ox - 3, layout.oy - 3, layout.gridW + 6, layout.gridH + 6)

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const ter = world.terrain[r * COLS + c] as Terrain
      const { x, y, s } = cellRect(layout, c, r)
      const alt = hash01(c * 17 + r * 9) > 0.55
      ctx.fillStyle = (alt ? TERRAIN_B[ter] : TERRAIN_A[ter]) ?? '#1C2A18'
      ctx.fillRect(x, y, s + 0.4, s + 0.4)

      if (ter === TERRAIN.field) {
        ctx.strokeStyle = 'rgba(90, 140, 55, 0.28)'
        ctx.lineWidth = 1
        const rows = 3
        for (let i = 1; i <= rows; i++) {
          ctx.beginPath()
          ctx.moveTo(x, y + (s * i) / (rows + 1))
          ctx.lineTo(x + s, y + (s * i) / (rows + 1))
          ctx.stroke()
        }
      } else if (ter === TERRAIN.monte) {
        const trees = 1 + Math.floor(hash01(c * 4 + r * 11) * 2)
        for (let i = 0; i < trees; i++) {
          const tx = x + s * (0.25 + hash01(c + i * 8) * 0.5)
          const ty = y + s * (0.3 + hash01(r + i * 5) * 0.45)
          const rad = Math.max(0.8, s * (0.18 + hash01(i * 13 + c) * 0.14))
          ctx.fillStyle = i % 2 ? '#16351f' : '#0f2a18'
          ctx.beginPath()
          ctx.arc(tx, ty, rad, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = '#2d5a38'
          ctx.beginPath()
          ctx.arc(tx - rad * 0.15, ty - rad * 0.2, rad * 0.45, 0, Math.PI * 2)
          ctx.fill()
        }
      } else if (ter === TERRAIN.path) {
        ctx.fillStyle = '#6A5640'
        ctx.fillRect(x + s * 0.18, y, s * 0.64, s + 0.4)
        ctx.fillRect(x, y + s * 0.18, s + 0.4, s * 0.64)
        ctx.fillStyle = 'rgba(232, 198, 132, 0.22)'
        ctx.fillRect(x + s * 0.46, y, s * 0.08, s + 0.4)
        ctx.fillRect(x, y + s * 0.46, s + 0.4, s * 0.08)
      } else if (ter === TERRAIN.water) {
        const shimmer = 0.12 + 0.1 * Math.sin(now / 260 + c * 0.8 + r)
        ctx.fillStyle = `rgba(70, 170, 210, ${shimmer})`
        ctx.fillRect(x, y, s, s)
        ctx.strokeStyle = `rgba(180, 230, 255, ${0.15 + shimmer * 0.4})`
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(x + 2, y + s * 0.35 + Math.sin(now / 200 + c) * 2)
        ctx.lineTo(x + s - 2, y + s * 0.45 + Math.sin(now / 180 + r) * 2)
        ctx.stroke()
      } else if (ter === TERRAIN.shed) {
        ctx.fillStyle = '#4A3428'
        ctx.fillRect(x + s * 0.15, y + s * 0.4, s * 0.7, s * 0.45)
        ctx.fillStyle = '#2A1C14'
        ctx.beginPath()
        ctx.moveTo(x + s * 0.1, y + s * 0.42)
        ctx.lineTo(x + s * 0.5, y + s * 0.18)
        ctx.lineTo(x + s * 0.9, y + s * 0.42)
        ctx.fill()
      }
    }
  }
}

export function drawFrame(ctx: CanvasRenderingContext2D, w: number, h: number, opts: DrawOpts) {
  const { layout, world } = opts
  const shake = opts.shake
  const ox = shake ? (hash01(opts.now * 0.08) - 0.5) * shake : 0
  const oy = shake ? (hash01(opts.now * 0.11 + 2) - 0.5) * shake : 0
  ctx.save()
  ctx.translate(ox, oy)

  ctx.fillStyle = '#07080C'
  ctx.fillRect(-20, -20, w + 40, h + 40)

  const heat = opts.clutch ? 0.28 : 0.1
  const glow = ctx.createRadialGradient(w * 0.5, h * 0.46, 12, w * 0.5, h * 0.52, Math.max(w, h) * 0.72)
  glow.addColorStop(0, `rgba(72, 22, 8, ${heat + 0.14})`)
  glow.addColorStop(0.55, '#10140F')
  glow.addColorStop(1, '#07080C')
  ctx.fillStyle = glow
  ctx.fillRect(-20, -20, w + 40, h + 40)

  if (!world) {
    ctx.restore()
    return
  }

  drawStars(ctx, w, h, layout, opts.now)
  drawTerrain(ctx, layout, world, opts.now)
  drawGuide(ctx, layout, opts.guide ?? [], opts.now)

  const savedKey = new Set(opts.saved.map((cell) => `${cell.c},${cell.r}`))
  const active = incidentAt(opts.t, world)
  const resolved = new Set(opts.strokes.map((s) => s.incident))
  for (const inc of world.incidents) {
    if (opts.t >= inc.commitMs) resolved.add(inc.id)
  }
  drawFire(ctx, layout, world, opts.t, opts.now, savedKey, active?.id ?? null, resolved)

  for (const cell of opts.ghost) {
    const { x, y, s } = cellRect(layout, cell.c, cell.r)
    const pulse = 0.2 + 0.16 * Math.sin(opts.now / 90)
    ctx.fillStyle = `rgba(125, 220, 104, ${pulse})`
    ctx.fillRect(x, y, s, s)
    ctx.strokeStyle = `rgba(232, 255, 210, ${0.35 + pulse})`
    ctx.lineWidth = 1.6
    ctx.strokeRect(x + 1, y + 1, s - 2, s - 2)
  }

  for (const cell of opts.saved) {
    const age = opts.now - cell.born - cell.delay
    if (age < 0) continue
    const u = Math.min(1, age / 320)
    const { x, y, s } = cellRect(layout, cell.c, cell.r)
    ctx.fillStyle = `rgba(196, 181, 253, ${0.22 + 0.38 * u})`
    ctx.fillRect(x, y, s, s)
    if (u < 1) {
      ctx.strokeStyle = `rgba(255, 255, 255, ${1 - u})`
      ctx.lineWidth = 2.4
      ctx.strokeRect(x + 1, y + 1, s - 2, s - 2)
      ctx.beginPath()
      ctx.arc(x + s / 2, y + s / 2, s * (0.2 + u * 0.7), 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(125, 220, 104, ${1 - u})`
      ctx.lineWidth = 2
      ctx.stroke()
    }
  }

  drawWind(ctx, layout, world, active, opts.now)
  drawNode(ctx, layout, world, Boolean(active), opts.now, opts.clutch, opts.hint)
  drawHouse(ctx, layout, world)

  for (const inc of world.incidents) {
    if (opts.t < inc.appearMs) continue
    drawFocus(ctx, layout, inc, active?.id === inc.id, opts.t, opts.now, opts.clutch, opts.canAct)
  }

  const drawStroke = (stroke: Stroke, color: string, width: number, glowColor?: string) => {
    if (stroke.points.length < 2) return
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    if (glowColor) {
      ctx.shadowColor = glowColor
      ctx.shadowBlur = 22
    }
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
    ctx.shadowBlur = 0
  }

  for (const stroke of opts.strokes) {
    drawStroke(stroke, 'rgba(196,181,253,0.55)', 7, 'rgba(196,181,253,0.55)')
    drawStroke(stroke, 'rgba(255,255,255,0.72)', 2.2)
  }
  if (opts.drawing) {
    const color = opts.onRoad ? '#C4B5FD' : '#F2A021'
    const glowCol = opts.onRoad ? '#C4B5FD' : '#FF6A1A'
    drawStroke(opts.drawing, glowCol, 9, glowCol)
    drawStroke(opts.drawing, color, 5.2)
    drawStroke(opts.drawing, '#fff', 2)
    const tip = opts.drawing.points[opts.drawing.points.length - 1]
    if (tip) {
      const tx = layout.ox + tip.x * layout.gridW
      const ty = layout.oy + tip.y * layout.gridH
      const g = ctx.createRadialGradient(tx, ty, 0, tx, ty, 22)
      g.addColorStop(0, '#fff')
      g.addColorStop(0.3, color)
      g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(tx, ty, 22, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  if (opts.runner && opts.runner.points.length > 1) {
    const pts = opts.runner.points.filter((p) => p && Number.isFinite(p.x) && Number.isFinite(p.y))
    if (pts.length > 1) {
      const u = Math.min(1, Math.max(0, (opts.now - opts.runner.born) / 680))
      const idx = Math.min(pts.length - 1, Math.max(0, Math.floor(u * (pts.length - 1))))
      const a = pts[idx]
      const b = pts[Math.min(pts.length - 1, idx + 1)]
      if (a && b) {
        const frac = u * (pts.length - 1) - idx
        const rx = layout.ox + (a.x + (b.x - a.x) * frac) * layout.gridW
        const ry = layout.oy + (a.y + (b.y - a.y) * frac) * layout.gridH
        const step = Math.max(1, Math.floor(pts.length / 10))
        for (let k = 0; k < idx; k += step) {
          const p = pts[k]
          if (!p) continue
          const px = layout.ox + p.x * layout.gridW
          const py = layout.oy + p.y * layout.gridH
          ctx.globalAlpha = 0.18
          ctx.fillStyle = '#7DDC68'
          ctx.beginPath()
          ctx.arc(px, py, 4, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.globalAlpha = 1
        const g = ctx.createRadialGradient(rx, ry, 0, rx, ry, 28)
        g.addColorStop(0, '#fff')
        g.addColorStop(0.28, '#7DDC68')
        g.addColorStop(1, 'rgba(22,181,125,0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(rx, ry, 28, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  for (const shock of opts.shocks ?? []) {
    const u = (opts.now - shock.born) / 560
    if (u < 0 || u > 1) continue
    ctx.strokeStyle = shock.color
    ctx.globalAlpha = 1 - u
    ctx.lineWidth = 5 * (1 - u)
    ctx.beginPath()
    ctx.arc(shock.x, shock.y, 16 + u * 110, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(shock.x, shock.y, 8 + u * 58, 0, Math.PI * 2)
    ctx.lineWidth = 2.2 * (1 - u)
    ctx.stroke()
    ctx.globalAlpha = 1
  }

  for (const p of opts.particles) {
    ctx.globalAlpha = Math.max(0, p.life)
    ctx.fillStyle = p.color
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
  }

  ctx.fillStyle = 'rgba(217,220,225,0.5)'
  ctx.font = `800 ${Math.floor(layout.cell * 0.58)}px ui-sans-serif, system-ui`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'
  ctx.fillText('N', layout.ox + layout.gridW + 14, layout.oy + 22)

  const latest = opts.juice[opts.juice.length - 1]
  if (latest) {
    const age = opts.now - latest.born
    const u = Math.min(1, age / 140)
    const fade = Math.max(0, 1 - age / 1400)
    const cx = w / 2
    const cy = h * 0.3
    ctx.globalAlpha = fade
    const size = Math.floor(Math.min(w, h) * 0.07 * (latest.scale ?? 1) * (1.2 - 0.18 * u))
    ctx.font = `900 ${size}px ui-sans-serif, system-ui`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.lineJoin = 'round'
    ctx.lineWidth = Math.max(6, size * 0.14)
    ctx.strokeStyle = '#07080C'
    ctx.strokeText(latest.label, cx, cy - age * 0.045)
    ctx.fillStyle = latest.color
    ctx.shadowColor = latest.color
    ctx.shadowBlur = 22
    ctx.fillText(latest.label, cx, cy - age * 0.045)
    ctx.shadowBlur = 0
    ctx.globalAlpha = 1
  }

  for (const f of opts.floaters) {
    const age = opts.now - f.born
    ctx.globalAlpha = Math.max(0, 1 - age / 1100)
    ctx.fillStyle = f.color
    ctx.font = `900 ${Math.floor(Math.min(w, h) * 0.048)}px ui-sans-serif, system-ui`
    ctx.textAlign = 'center'
    ctx.strokeStyle = '#07080C'
    ctx.lineWidth = 5
    ctx.strokeText(f.text, f.x, f.y - age * 0.07)
    ctx.fillText(f.text, f.x, f.y - age * 0.07)
    ctx.globalAlpha = 1
  }

  if (opts.flash > 0.01) {
    const tint =
      opts.flashTint === 'save'
        ? '125, 220, 104'
        : opts.flashTint === 'miss'
          ? '227, 75, 52'
          : '255, 214, 170'
    ctx.fillStyle = `rgba(${tint}, ${Math.min(0.34, opts.flash)})`
    ctx.fillRect(-20, -20, w + 40, h + 40)
  }

  ctx.restore()
}

function drawFire(
  ctx: CanvasRenderingContext2D,
  layout: GridLayout,
  world: World,
  t: number,
  now: number,
  savedKey: Set<string>,
  activeId: number | null,
  resolved: Set<number>,
) {
  for (const inc of world.incidents) {
    if (t < inc.appearMs) continue
    const cells = assetCells(world, inc).filter(
      (cell) => fireTimeMs(inc, cell) <= t && !savedKey.has(`${cell.c},${cell.r}`),
    )
    if (!cells.length) continue
    const isHot = inc.id === activeId && !resolved.has(inc.id)
    if (!isHot) {
      for (const cell of cells) {
        const { x, y, s } = cellRect(layout, cell.c, cell.r)
        ctx.fillStyle = 'rgba(36, 22, 16, 0.9)'
        ctx.fillRect(x, y, s + 0.4, s + 0.4)
        ctx.fillStyle = 'rgba(80, 48, 32, 0.35)'
        ctx.fillRect(x + s * 0.2, y + s * 0.2, s * 0.6, s * 0.6)
      }
      continue
    }
    let minc = COLS
    let maxc = 0
    let minr = ROWS
    let maxr = 0
    for (const cell of cells) {
      minc = Math.min(minc, cell.c)
      maxc = Math.max(maxc, cell.c)
      minr = Math.min(minr, cell.r)
      maxr = Math.max(maxr, cell.r)
    }
    const x0 = layout.ox + minc * layout.cell
    const y0 = layout.oy + minr * layout.cell
    const bw = (maxc - minc + 1) * layout.cell
    const bh = (maxr - minr + 1) * layout.cell
    const gx = x0 + bw / 2
    const gy = y0 + bh / 2
    const blob = ctx.createRadialGradient(gx, gy, 4, gx, gy, Math.max(bw, bh) * 0.85)
    blob.addColorStop(0, 'rgba(255, 210, 90, 0.38)')
    blob.addColorStop(0.45, 'rgba(255, 90, 18, 0.28)')
    blob.addColorStop(1, 'rgba(80, 10, 0, 0)')
    ctx.fillStyle = blob
    ctx.fillRect(x0 - layout.cell, y0 - layout.cell, bw + layout.cell * 2, bh + layout.cell * 2)

    for (const cell of cells) {
      const { x, y, s } = cellRect(layout, cell.c, cell.r)
      const flicker = 0.32 + 0.32 * Math.sin(now / 70 + cell.c * 1.7 + cell.r)
      const g = ctx.createRadialGradient(x + s / 2, y + s * 0.4, 0, x + s / 2, y + s / 2, s * 0.72)
      g.addColorStop(0, `rgba(255, 245, 180, ${0.55 + flicker * 0.35})`)
      g.addColorStop(0.4, `rgba(255, 120, 24, ${0.5 + flicker * 0.4})`)
      g.addColorStop(1, 'rgba(140, 20, 0, 0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(x + s / 2, y + s / 2, s * 0.62, 0, Math.PI * 2)
      ctx.fill()
    }

    for (let i = 0; i < 8; i++) {
      const cell = cells[Math.floor(hash01(inc.id * 11 + i + Math.floor(now / 180)) * cells.length)]!
      const { x, y, s } = cellRect(layout, cell.c, cell.r)
      const rise = ((now / 420 + i * 0.13) % 1)
      ctx.globalAlpha = 1 - rise
      ctx.fillStyle = i % 2 ? '#FFE7A0' : '#FF6A1A'
      ctx.beginPath()
      ctx.arc(x + s * 0.3 + hash01(i) * s * 0.4, y + s * 0.4 - rise * s * 1.6, 1.4 + (1 - rise) * 1.8, 0, Math.PI * 2)
      ctx.fill()
    }
    for (let i = 0; i < 6; i++) {
      const u = (now / 1100 + i * 0.16) % 1
      const cell = cells[Math.floor(hash01(inc.id * 3 + i) * cells.length)]!
      const { x, y, s } = cellRect(layout, cell.c, cell.r)
      ctx.globalAlpha = 0.18 * (1 - u)
      ctx.fillStyle = '#9aa3ad'
      ctx.beginPath()
      ctx.arc(x + s * 0.5 + (hash01(i) - 0.5) * s, y + s * 0.1 - u * s * 2.4, s * (0.22 + u * 0.4), 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }
}

function drawNode(
  ctx: CanvasRenderingContext2D,
  layout: GridLayout,
  world: World,
  hot: boolean,
  now: number,
  clutch: boolean,
  hint: boolean,
) {
  const node = cellRect(layout, world.node.c, world.node.r)
  const cx = node.x + node.s / 2
  const cy = node.y + node.s / 2
  const ping = (now / (hot ? 700 : 1600)) % 1
  ctx.strokeStyle = `rgba(22, 181, 125, ${0.55 - ping * 0.45})`
  ctx.lineWidth = 2.4
  ctx.beginPath()
  ctx.arc(cx, cy, node.s * (0.55 + ping * 1.05), 0, Math.PI * 2)
  ctx.stroke()
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, node.s * 0.55)
  g.addColorStop(0, '#fff')
  g.addColorStop(0.28, '#9BE88A')
  g.addColorStop(0.62, clutch ? '#F2A021' : '#16B57D')
  g.addColorStop(1, '#0d3d2c')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(cx, cy, node.s * 0.46, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#E8E4FF'
  ctx.beginPath()
  ctx.arc(cx, cy, node.s * 0.13, 0, Math.PI * 2)
  ctx.fill()
  if (hot && hint) {
    ctx.font = `900 ${Math.max(11, Math.floor(node.s * 0.36))}px ui-sans-serif, system-ui`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'
    ctx.lineWidth = 4
    ctx.strokeStyle = '#07080C'
    ctx.strokeText('NODO', cx, cy - node.s * 0.72)
    ctx.fillStyle = '#E8E4FF'
    ctx.fillText('NODO', cx, cy - node.s * 0.72)
  }
}

function drawGuide(
  ctx: CanvasRenderingContext2D,
  layout: GridLayout,
  guide: { x: number; y: number }[],
  now: number,
) {
  if (guide.length < 2) return
  ctx.save()
  ctx.setLineDash([7, 11])
  ctx.lineDashOffset = -now / 16
  ctx.strokeStyle = 'rgba(22, 181, 125, 0.62)'
  ctx.lineWidth = 3.4
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.beginPath()
  for (let i = 0; i < guide.length; i++) {
    const p = guide[i]!
    const x = layout.ox + p.x * layout.gridW
    const y = layout.oy + p.y * layout.gridH
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()
  ctx.setLineDash([])
  const u = (now / 900) % 1
  const i = Math.min(guide.length - 2, Math.floor(u * (guide.length - 1)))
  const a = guide[i]!
  const b = guide[i + 1]!
  const f = u * (guide.length - 1) - i
  const px = layout.ox + (a.x + (b.x - a.x) * f) * layout.gridW
  const py = layout.oy + (a.y + (b.y - a.y) * f) * layout.gridH
  ctx.fillStyle = '#E8FFD2'
  ctx.beginPath()
  ctx.arc(px, py, 5.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawHouse(ctx: CanvasRenderingContext2D, layout: GridLayout, world: World) {
  const house = cellRect(layout, world.house.c, world.house.r)
  ctx.fillStyle = '#E8DCC8'
  ctx.fillRect(house.x + house.s * 0.2, house.y + house.s * 0.35, house.s * 0.6, house.s * 0.45)
  ctx.fillStyle = '#C45C3E'
  ctx.beginPath()
  ctx.moveTo(house.x + house.s * 0.15, house.y + house.s * 0.38)
  ctx.lineTo(house.x + house.s * 0.5, house.y + house.s * 0.12)
  ctx.lineTo(house.x + house.s * 0.85, house.y + house.s * 0.38)
  ctx.fill()
}

function drawFocus(
  ctx: CanvasRenderingContext2D,
  layout: GridLayout,
  inc: Incident,
  hot: boolean,
  t: number,
  now: number,
  clutch: boolean,
  canAct: boolean,
) {
  const focus = cellRect(layout, inc.focus.c, inc.focus.r)
  const cx = focus.x + focus.s / 2
  const cy = focus.y + focus.s / 2
  if (hot && canAct) {
    const ping = (now / 650) % 1
    ctx.strokeStyle = `rgba(255, 106, 26, ${0.7 - ping * 0.6})`
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(cx, cy, focus.s * (1.35 + ping * 1.1), 0, Math.PI * 2)
    ctx.stroke()
  }
  if (hot) {
    const span = Math.max(1, inc.commitMs - inc.appearMs)
    const left = Math.max(0, (inc.commitMs - t) / span)
    ctx.strokeStyle = clutch ? '#E34B34' : '#F2A021'
    ctx.lineWidth = 3.4
    ctx.beginPath()
    ctx.arc(cx, cy, focus.s * 1.12, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * left)
    ctx.stroke()
    const secs = Math.ceil(Math.max(0, inc.commitMs - t) / 1000)
    if (secs > 0 && secs <= 5) {
      ctx.font = `900 ${Math.floor(focus.s * 0.95)}px ui-sans-serif, system-ui`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      ctx.lineWidth = 5
      ctx.strokeStyle = '#07080C'
      ctx.strokeText(String(secs), cx, cy - focus.s * 1.35)
      ctx.fillStyle = clutch ? '#E34B34' : '#FFFFFF'
      ctx.fillText(String(secs), cx, cy - focus.s * 1.35)
    }
  }
  ctx.fillStyle = hot ? (clutch ? '#E34B34' : '#FF6A1A') : '#3A2418'
  ctx.beginPath()
  ctx.moveTo(cx, cy - focus.s * 0.48)
  ctx.lineTo(cx + focus.s * 0.44, cy)
  ctx.lineTo(cx, cy + focus.s * 0.48)
  ctx.lineTo(cx - focus.s * 0.44, cy)
  ctx.closePath()
  ctx.fill()
  if (hot) {
    ctx.fillStyle = `rgba(255, 240, 180, ${0.6 + 0.4 * Math.sin(now / 70)})`
    ctx.beginPath()
    ctx.arc(cx, cy, focus.s * 0.16, 0, Math.PI * 2)
    ctx.fill()
  }
  if (hot && canAct && inc.id === 0) {
    ctx.font = `900 ${Math.max(12, Math.floor(focus.s * 0.38))}px ui-sans-serif, system-ui`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.lineWidth = 5
    ctx.strokeStyle = '#07080C'
    ctx.strokeText('FUEGO', cx, cy + focus.s * 0.7)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText('FUEGO', cx, cy + focus.s * 0.7)
  }
}

function drawAim(
  ctx: CanvasRenderingContext2D,
  layout: GridLayout,
  world: World,
  active: Incident,
  now: number,
  clutch: boolean,
  hint: boolean,
) {
  const node = cellRect(layout, world.node.c, world.node.r)
  const focus = cellRect(layout, active.focus.c, active.focus.r)
  const x0 = node.x + node.s / 2
  const y0 = node.y + node.s / 2
  const x1 = focus.x + focus.s / 2
  const y1 = focus.y + focus.s / 2
  ctx.save()
  ctx.setLineDash([8, 8])
  ctx.lineDashOffset = -now / 22
  ctx.strokeStyle = clutch ? 'rgba(227,75,52,0.85)' : 'rgba(242,160,33,0.72)'
  ctx.lineWidth = 3.2
  ctx.beginPath()
  ctx.moveTo(x0, y0)
  ctx.lineTo(x1, y1)
  ctx.stroke()
  ctx.setLineDash([])
  const u = (now / 720) % 1
  const px = x0 + (x1 - x0) * u
  const py = y0 + (y1 - y0) * u
  const g = ctx.createRadialGradient(px, py, 0, px, py, 14)
  g.addColorStop(0, '#fff')
  g.addColorStop(0.4, clutch ? '#E34B34' : '#F2A021')
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(px, py, 14, 0, Math.PI * 2)
  ctx.fill()
  if (hint) {
    ctx.font = `800 ${Math.max(11, Math.floor(layout.cell * 0.42))}px ui-sans-serif, system-ui`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.lineWidth = 4
    ctx.strokeStyle = '#07080C'
    ctx.strokeText('AL FUEGO', (x0 + x1) / 2, (y0 + y1) / 2 - 14)
    ctx.fillStyle = '#F2A021'
    ctx.fillText('AL FUEGO', (x0 + x1) / 2, (y0 + y1) / 2 - 14)
  }
  ctx.restore()
}

function drawWind(
  ctx: CanvasRenderingContext2D,
  layout: GridLayout,
  world: World,
  active: Incident | null,
  now: number,
) {
  if (!active) return
  const origin = cellRect(layout, active.focus.c, active.focus.r)
  const cx = origin.x + origin.s / 2
  const cy = origin.y + origin.s / 2
  ctx.strokeStyle = 'rgba(242, 160, 33, 0.7)'
  ctx.lineWidth = 2.4
  for (let i = 0; i < 3; i++) {
    const u = (now / 620 + i * 0.33) % 1
    const x = cx + active.wind.c * layout.cell * (1.2 + u * 2.4)
    const y = cy + active.wind.r * layout.cell * (1.2 + u * 2.4)
    ctx.globalAlpha = 1 - u
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + active.wind.c * 10, y + active.wind.r * 10)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}
