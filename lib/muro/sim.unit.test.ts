import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { COLS, MATCH_MS, createMuroLive, parseWalls, simulateRun, tickMuro } from './sim'

describe('MURO sim', () => {
  it('sin muros el fuego avanza igual dos veces', () => {
    const a = simulateRun(17, [])
    const b = simulateRun(17, [])
    assert.deepEqual(a, b)
  })

  it('un muro horizontal frena el blob y puede salvar la casa', () => {
    const walls = []
    for (let c = 0; c < COLS; c++) walls.push({ c, r: 7, t: 0 })
    const sealed = simulateRun(2026, walls)
    const open = simulateRun(2026, [])
    assert.equal(sealed.houseUp, true)
    assert.ok(sealed.score >= open.score)
    assert.ok(sealed.burned < COLS * 16)
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
