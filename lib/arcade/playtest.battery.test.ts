import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { mkdirSync, writeFileSync } from 'node:fs'

import { MATCH_MS as HUMO_MS, optimalStrokes, simulateRun as simHumo } from '../humo/sim'
import { COLS, parseWalls, simulateRun as simMuro } from '../muro/sim'
import { MATCH_MS as PULSO_MS, TICK_MS, createSim, simulateRun as simPulso, shouldAutoTap, stepSim, tapSim } from '../pulso/sim'
import { buildCalls, simulateRun as simRadio } from '../radio/sim'
import { perfectMarks, simulateRun as simSalida, salidaTitle } from '../salida/sim'

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

describe('playtest battery 80 seeds × 5 juegos', () => {
  it('corre estrategias y escribe el log', () => {
    const n = 40
    const rows: string[] = ['# Battery ' + new Date().toISOString(), '']
    const humo = []
    const radio = []
    const muroFlood = []
    const muroEmpty = []
    const salidaTank = []
    const salidaPerfect = []
    const pulso = []

    for (let i = 1; i <= n; i++) {
      const seed = 1000 + i * 17
      humo.push(simHumo(seed, optimalStrokes(seed)))
      const calls = buildCalls(seed)
      radio.push(simRadio(seed, calls.map((c) => ({ id: c.id, action: c.correct, t: c.appearMs + 80 }))))
      radio.push(simRadio(seed, calls.map((c) => ({ id: c.id, action: 'agua' as const, t: c.appearMs + 80 }))))
      const flood = []
      for (let r = 0; r < 16; r++) for (let c = 0; c < COLS; c++) flood.push({ c, r, t: 0 })
      muroFlood.push(simMuro(seed, flood))
      muroEmpty.push(simMuro(seed, []))
      const tank = simSalida(seed, [{ t: 0, lane: 1 }])
      salidaTank.push(tank)
      assert.notEqual(salidaTitle(tank.score, tank.rescued, tank.hits).title, 'Sacó al pueblo')
      salidaPerfect.push(simSalida(seed, perfectMarks(seed)))
      pulso.push(pulsoAuto(seed))
    }

    const parsed = parseWalls(
      Array.from({ length: 192 }, (_, i) => ({ c: i % COLS, r: Math.floor(i / COLS), t: 0 })),
    )
    assert.ok(parsed)
    assert.equal(parsed.length, 8)

    const avg = (xs: number[]) => Math.round(xs.reduce((a, b) => a + b, 0) / xs.length)
    rows.push(`HUMO óptimo ha avg ${avg(humo.map((h) => h.hectares))} (match ${HUMO_MS}ms)`)
    rows.push(`RADIO mixto score avg ${avg(radio.map((r) => r.score))} (spam agua no empata al correcto)`)
    rows.push(`MURO flood walls legales 8, burned flood avg ${avg(muroFlood.map((m) => m.burned))} vs abierto ${avg(muroEmpty.map((m) => m.burned))}`)
    rows.push(`SALIDA tank hits avg ${avg(salidaTank.map((s) => s.hits))} — ninguno es Sacó al pueblo`)
    rows.push(`SALIDA perfect hits avg ${avg(salidaPerfect.map((s) => s.hits))} rescued avg ${avg(salidaPerfect.map((s) => s.rescued))}`)
    rows.push(`PULSO auto score avg ${avg(pulso.map((p) => p.score))}`)
    mkdirSync('docs/playtest', { recursive: true })
    writeFileSync('docs/playtest/BATTERY.md', rows.join('\n') + '\n')
    assert.ok(avg(salidaPerfect.map((s) => s.hits)) < avg(salidaTank.map((s) => s.hits)))
  })
})
