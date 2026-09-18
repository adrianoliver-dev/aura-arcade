import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { MATCH_MS, ROUND_CALLS, buildCalls, parseDecisions, simulateRun } from './sim'

describe('RADIO ROJA sim', () => {
  it('es determinista, tiene siete señales y nunca repite escenario', () => {
    const a = buildCalls(2026)
    const b = buildCalls(2026)
    assert.deepEqual(a, b)
    assert.equal(a.length, ROUND_CALLS)
    assert.equal(new Set(a.map((call) => call.scenarioId)).size, ROUND_CALLS)
    assert.ok(a.at(-1)!.commitMs <= MATCH_MS)
  })

  it('mezcla órdenes sin encadenar tres de la misma', () => {
    const calls = buildCalls(44)
    for (let i = 2; i < calls.length; i += 1) {
      assert.notDeepEqual([calls[i - 2]!.correct, calls[i - 1]!.correct, calls[i]!.correct], ['agua', 'agua', 'agua'])
      assert.notDeepEqual([calls[i - 2]!.correct, calls[i - 1]!.correct, calls[i]!.correct], ['corte', 'corte', 'corte'])
      assert.notDeepEqual([calls[i - 2]!.correct, calls[i - 1]!.correct, calls[i]!.correct], ['evacua', 'evacua', 'evacua'])
    }
  })

  it('sin decisiones registra señales perdidas, pero conserva sus siete decisiones', () => {
    const result = simulateRun(9, [])
    assert.equal(result.saves, 0)
    assert.equal(result.misses, ROUND_CALLS)
    assert.equal(result.score, 0)
  })

  it('decisiones correctas puntúan y son deterministas', () => {
    const calls = buildCalls(44)
    const decisions = calls.map((c) => ({ id: c.id, action: c.correct, t: c.appearMs + 80 }))
    const a = simulateRun(44, decisions)
    const b = simulateRun(44, decisions)
    assert.deepEqual(a, b)
    assert.equal(a.saves, ROUND_CALLS)
    assert.ok(a.score > 240)
    assert.equal(a.housesLeft, 3)
  })

  it('un botón repetido no consigue la ronda ni inyecta varios commits', () => {
    const calls = buildCalls(44)
    const spam = calls.map((c) => ({ id: c.id, action: 'agua' as const, t: c.appearMs + 80 }))
    const r = simulateRun(44, spam)
    const aguaOk = calls.filter((c) => c.correct === 'agua').length
    assert.ok(r.saves <= aguaOk)
    assert.ok(r.misses >= 1)
    assert.equal(parseDecisions([...spam, spam[0]!]), null)
  })
})
