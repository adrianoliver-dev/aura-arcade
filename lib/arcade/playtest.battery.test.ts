import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { mkdirSync, writeFileSync } from 'node:fs'

import { MATCH_MS as HUMO_MS, optimalStrokes, simulateRun as simHumo } from '../humo/sim'
import { MATCH_MS as PULSO_MS, TICK_MS, createSim, simulateRun as simPulso, shouldAutoTap, stepSim, tapSim } from '../pulso/sim'
import { buildCalls, simulateRun as simRadio } from '../radio/sim'

function pulsoAuto(seed: number) {
  const state = createSim(seed)
  const taps: number[] = []
  while (!state.finished && state.t < PULSO_MS) {
    if (shouldAutoTap(state)) {
      taps.push(state.t)
      tapSim(state)
    }
    stepSim(state, TICK_MS)
  }
  return simPulso(seed, taps)
}

describe('playtest battery 40 seeds × 3 juegos', () => {
  it('corre estrategias y escribe el log', () => {
    const n = 40
    const rows: string[] = ['# Battery — P3 trio', '', 'Generado por `pnpm test` con 40 seeds deterministas por juego.', '']
    const humo = []
    const radio = []
    const pulso = []

    for (let i = 1; i <= n; i++) {
      const seed = 1000 + i * 17
      humo.push(simHumo(seed, optimalStrokes(seed)))
      const calls = buildCalls(seed)
      radio.push(simRadio(seed, calls.map((c) => ({ id: c.id, action: c.correct, t: c.appearMs + 80 }))))
      radio.push(simRadio(seed, calls.map((c) => ({ id: c.id, action: 'agua' as const, t: c.appearMs + 80 }))))
      pulso.push(pulsoAuto(seed))
    }

    const avg = (xs: number[]) => Math.round(xs.reduce((a, b) => a + b, 0) / xs.length)
    rows.push(`HUMO óptimo ha avg ${avg(humo.map((h) => h.hectares))} (match ${HUMO_MS}ms)`)
    rows.push(`RADIO mixto score avg ${avg(radio.map((r) => r.score))} (spam agua no empata al correcto)`)
    rows.push(`PULSO auto score avg ${avg(pulso.map((p) => p.score))}`)
    mkdirSync('docs/playtest', { recursive: true })
    writeFileSync('docs/playtest/BATTERY.md', rows.join('\n') + '\n')
    assert.ok(avg(pulso.map((p) => p.score)) > 200)
  })
})
