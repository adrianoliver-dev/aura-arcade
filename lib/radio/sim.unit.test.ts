import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { MATCH_MS, buildCalls, parseDecisions, simulateRun } from './sim'

describe('RADIO ROJA sim', () => {
  it('mismas llamadas con el mismo seed', () => {
    const a = buildCalls(2026)
    const b = buildCalls(2026)
    assert.deepEqual(a, b)
    assert.ok(a.length >= 8)
    assert.ok(a.at(-1)!.commitMs <= MATCH_MS)
  })

  it('sin decisiones pierde casas', () => {
    const r = simulateRun(9, [])
    assert.equal(r.saves, 0)
    assert.ok(r.housesLeft < 3)
    assert.equal(r.score, 0)
  })

  it('decisiones correctas puntúan y son deterministas', () => {
    const calls = buildCalls(44)
    const decisions = calls.map((c) => ({ id: c.id, action: c.correct, t: c.appearMs + 80 }))
    const a = simulateRun(44, decisions)
    const b = simulateRun(44, decisions)
    assert.deepEqual(a, b)
    assert.ok(a.score > 80)
    assert.equal(a.housesLeft, 3)
    assert.ok(a.saves >= 8)
  })

  it('rechaza payload sucio', () => {
    assert.equal(parseDecisions('no'), null)
    assert.ok(parseDecisions([{ id: 0, action: 'agua', t: 10 }]))
  })
})
