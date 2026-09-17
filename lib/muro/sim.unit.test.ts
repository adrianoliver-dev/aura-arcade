import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { COLS, MATCH_MS, createMuroLive, parseWalls, simulateRun, tickMuro } from './sim'

describe('MURO sim', () => {
  it('sin muros el fuego avanza igual dos veces', () => {
    const a = simulateRun(17, [])
    const b = simulateRun(17, [])
    assert.deepEqual(a, b)
  })

  it('un muro legal quema menos que el predio abierto', () => {
    const walls = []
    for (let c = 2; c < 10; c++) walls.push({ c, r: 6, t: 0 })
    const sealed = simulateRun(2026, walls)
    const open = simulateRun(2026, [])
    assert.ok(sealed.burned <= open.burned)
  })

  it('el stock recorta el flood fill', () => {
    const flood = []
    for (let r = 0; r < 16; r++) {
      for (let c = 0; c < COLS; c++) flood.push({ c, r, t: 0 })
    }
    const parsed = parseWalls(flood)
    assert.ok(parsed)
    assert.equal(parsed.length, 8)
    assert.deepEqual(simulateRun(9, flood), simulateRun(9, parsed))
  })

  it('ticks client/server coinciden', () => {
    let live = createMuroLive(3)
    let t = 0
    while (t < 8000) {
      t += 340
      live = tickMuro(live, 3, [], t)
    }
    assert.ok(live.burned >= 2)
    assert.ok(live.ticks > 0)
  })

  it('parsea muros', () => {
    assert.equal(parseWalls(null), null)
    assert.ok(parseWalls([{ c: 1, r: 2, t: 10 }]))
    assert.ok(MATCH_MS === 90_000)
  })
})
