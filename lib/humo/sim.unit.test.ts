import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  COLS,
  FOCO_N,
  MATCH_MS,
  TARGET_MIN_PX,
  TELEGRAPH_MS,
  WINDOWS,
  createWorld,
  corridorStroke,
  daySeed,
  encodeShareSeed,
  firstGuidePath,
  guidePath,
  optimalStrokes,
  parseShareSeed,
  parseStrokes,
  playSeed,
  previewEta,
  rasterizeStroke,
  reachable,
  resolveIncident,
  simulateRun,
} from './sim'

describe('ANTES DEL HUMO sim', () => {
  it('crea el mismo mundo para el mismo seed', () => {
    const a = createWorld(4242)
    const b = createWorld(4242)
    assert.deepEqual(a.node, b.node)
    assert.deepEqual(
      a.incidents.map((i) => i.focus),
      b.incidents.map((i) => i.focus),
    )
    assert.deepEqual(Array.from(a.terrain), Array.from(b.terrain))
  })

  it('mundos distintos con seeds distintos', () => {
    const a = createWorld(11)
    const b = createWorld(12)
    assert.notDeepEqual(Array.from(a.terrain), Array.from(b.terrain))
  })

  it('sin trazos no salva hectáreas', () => {
    const r = simulateRun(99, [])
    assert.equal(r.hectares, 0)
    assert.equal(r.efficiency, 0)
    assert.equal(r.medal, 'ALERTA')
  })

  it('trazo óptimo salva hectáreas y es determinista', () => {
    const seed = 2026
    const strokes = optimalStrokes(seed)
    const a = simulateRun(seed, strokes)
    const b = simulateRun(seed, strokes)
    assert.deepEqual(a, b)
    assert.ok(a.hectares >= 8)
    assert.ok(a.efficiency >= 40)
    assert.ok(a.savedByIncident.every((x) => x.arrived))
    assert.equal(a.savedByIncident.length, FOCO_N)
  })

  it('un trazo lejos del nodo no cuenta', () => {
    const world = createWorld(7)
    const focus = world.incidents[0]!.focus
    const r = simulateRun(7, [
      {
        incident: 0,
        points: [
          { x: 0.05, y: 0.05 },
          { x: (focus.c + 0.5) / world.cols, y: (focus.r + 0.5) / world.rows },
        ],
        t0: 2500,
        t1: 4000,
      },
    ])
    assert.equal(r.savedByIncident[0]!.saved, 0)
  })

  it('rasteriza una línea sin duplicar celdas consecutivas', () => {
    const world = createWorld(1)
    const cells = rasterizeStroke(world, [
      { x: 0.5, y: 0.5 },
      { x: 0.5, y: 0.5 },
      { x: 0.51, y: 0.5 },
    ])
    assert.ok(cells.length >= 1)
    for (let i = 1; i < cells.length; i++) {
      assert.notDeepEqual(cells[i], cells[i - 1])
    }
  })

  it('codifica y decodifica seed de share', () => {
    assert.equal(parseShareSeed(encodeShareSeed(424242)), 424242)
    assert.equal(parseShareSeed('???'), null)
    assert.equal(parseShareSeed(null), null)
  })

  it('parsea trazos o rechaza basura', () => {
    assert.deepEqual(parseStrokes([]), [])
    assert.equal(parseStrokes('nope'), null)
    const ok = parseStrokes([{ incident: 0, points: [{ x: 0.2, y: 0.3 }], t0: 1, t1: 2 }])
    assert.equal(ok?.[0]?.incident, 0)
  })

  it('la partida dura 40s', () => {
    assert.equal(MATCH_MS, 40_000)
    assert.equal(FOCO_N, 3)
    assert.equal(TELEGRAPH_MS, 0)
  })

  it('guidePath de casa coincide con firstGuidePath', () => {
    const world = createWorld(2026)
    assert.deepEqual(guidePath(world, world.incidents[0]!), firstGuidePath(world))
    assert.ok(guidePath(world, world.incidents[1]!).length >= 2)
  })

  it('los tres pulsos siguen el brief P2', () => {
    assert.deepEqual(WINDOWS, [
      { appearMs: 0, commitMs: 14_000 },
      { appearMs: 15_000, commitMs: 27_000 },
      { appearMs: 28_000, commitMs: 40_000 },
    ])
  })

  it('el resultado explica el porqué en una línea', () => {
    const empty = simulateRun(3, [])
    assert.ok(empty.headline.length > 8)
    assert.ok(empty.headline.length < 80)
  })
})

describe('ANTES DEL HUMO recovery', () => {
  it('la primera ruta guiada es siempre válida', () => {
    for (let i = 1; i <= 40; i++) {
      const world = createWorld(i * 97)
      const path = firstGuidePath(world)
      assert.ok(path.length > 1)
      const stroke = {
        incident: 0,
        points: path.map((cell) => ({ x: (cell.c + 0.5) / COLS, y: (cell.r + 0.5) / world.rows })),
        t0: world.incidents[0]!.appearMs + 200,
        t1: world.incidents[0]!.appearMs + 900,
      }
      const resolved = resolveIncident(world, world.incidents[0]!, stroke)
      assert.equal(resolved.arrived, true, `seed ${i * 97}`)
      assert.ok(resolved.saved > 0, `seed ${i * 97}`)
    }
  })

  it('el garabato no cambia el rescate: la respuesta abre el mismo corredor', () => {
    const seed = 20260918
    const world = createWorld(seed)
    const inc = world.incidents[1]!
    const t0 = inc.appearMs + 120
    const direct = corridorStroke(world, 1, 'fast', t0)
    const scribble = {
      ...direct,
      points: [
        direct.points[0]!,
        { x: 0.08, y: 0.1 },
        { x: 0.92, y: 0.86 },
        { x: 0.15, y: 0.82 },
        direct.points[direct.points.length - 1]!,
      ],
    }
    assert.deepEqual(resolveIncident(world, inc, scribble), resolveIncident(world, inc, direct))
  })

  it('score y seed coinciden en dos llamadas (cliente/servidor)', () => {
    const seed = daySeed(Date.parse('2026-09-18T12:00:00-04:00'))
    const strokes = optimalStrokes(seed)
    assert.deepEqual(simulateRun(seed, strokes), simulateRun(seed, strokes))
    assert.equal(playSeed(Date.parse('2026-09-18T12:00:00-04:00'), 0), seed)
    assert.equal(playSeed(Date.parse('2026-09-18T12:00:00-04:00'), 2), seed)
    assert.notEqual(playSeed(Date.parse('2026-09-18T12:00:00-04:00'), 3), seed)
  })

  it('no hay ruta imposible en 120 seeds', () => {
    let bad = 0
    for (let i = 1; i <= 120; i++) {
      if (!reachable(i * 13 + 7)) bad++
    }
    assert.equal(bad, 0)
  })

  it('ETA fantasma distingue verde y rojo', () => {
    const world = createWorld(44)
    const inc = world.incidents[0]!
    const path = firstGuidePath(world).map((cell) => ({
      x: (cell.c + 0.5) / COLS,
      y: (cell.r + 0.5) / world.rows,
    }))
    const early = previewEta(world, inc, path.slice(0, 2), inc.appearMs + 40)
    const late = previewEta(world, inc, path.slice(0, 2), inc.commitMs - 20)
    assert.notEqual(early, 'red')
    assert.equal(late, 'red')
  })

  it('targets táctiles son >= 48 CSS px', () => {
    assert.ok(TARGET_MIN_PX >= 48)
  })
})
