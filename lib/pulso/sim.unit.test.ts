import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { MATCH_MS, TICK_MS, createSim, shouldAutoTap, simulateRun, stepSim, tapSim } from './sim'

function guidedTaps(seed: number): number[] {
  const state = createSim(seed)
  const taps: number[] = []
  while (!state.finished) {
    if (shouldAutoTap(state)) {
      taps.push(state.t)
      tapSim(state)
    }
    stepSim(state, TICK_MS)
  }
  return taps
}

describe('PULSO sim', () => {
  it('termina una ronda corta y determinista', () => {
    assert.equal(simulateRun(2026, []).events.length >= 0, true)
    const taps = guidedTaps(2026)
    const a = simulateRun(2026, taps)
    const b = simulateRun(2026, taps)
    assert.deepEqual(a, b)
    assert.ok(a.score > 200)
  })

  it('no acepta tiempo fuera de la ronda', () => {
    const a = simulateRun(44, [MATCH_MS + 5_000])
    const b = simulateRun(44, [MATCH_MS])
    assert.deepEqual(a, b)
  })
})
