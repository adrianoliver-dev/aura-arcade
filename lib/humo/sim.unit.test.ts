import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  MATCH_MS,
  createWorld,
  encodeShareSeed,
  optimalStrokes,
  parseShareSeed,
  parseStrokes,
  rasterizeStroke,
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
  })

  it('trazo óptimo salva hectáreas y es determinista', () => {
    const seed = 2026
    const strokes = optimalStrokes(seed)
    const a = simulateRun(seed, strokes)
    const b = simulateRun(seed, strokes)
    assert.deepEqual(a, b)
    assert.ok(a.hectares > 20)
    assert.ok(a.efficiency >= 90)
    assert.ok(a.savedByIncident.every((x) => x.arrived))
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

  it('la partida dura 90s', () => {
    assert.equal(MATCH_MS, 90_000)
  })
})
