import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { MATCH_MS, applyEvent, buildTrack, emptyScore, parseMarks, perfectMarks, simulateRun } from './sim'

describe('SALIDA sim', () => {
  it('misma pista con el mismo seed', () => {
    assert.deepEqual(buildTrack(88), buildTrack(88))
    assert.ok(buildTrack(88).length > 20)
    assert.ok(buildTrack(88).every((e) => e.t < MATCH_MS))
  })

  it('quedarse en el medio es determinista', () => {
    const marks = [{ t: 0, lane: 1 }]
    const a = simulateRun(12, marks)
    const b = simulateRun(12, marks)
    assert.deepEqual(a, b)
    assert.ok(a.score >= 0)
  })

  it('applyEvent suma rescate', () => {
    const s = emptyScore()
    const kind = applyEvent({ t: 1000, lane: 1, kind: 'gente' }, 1, s)
    assert.equal(kind, 'save')
    assert.equal(s.rescued, 1)
    assert.ok(s.score > 0)
  })

  it('perfectMarks golpea menos que quedarse en el medio', () => {
    const tank = simulateRun(12, [{ t: 0, lane: 1 }])
    const pro = simulateRun(12, perfectMarks(12))
    assert.ok(pro.hits <= tank.hits)
  })

  it('applyEvent resta fuerte al golpe y parsea marcas', () => {
    const s = emptyScore()
    const kind = applyEvent({ t: 1000, lane: 1, kind: 'fuego' }, 1, s)
    assert.equal(kind, 'hit')
    assert.equal(s.hits, 1)
    assert.equal(s.score, 0)
    assert.equal(parseMarks('x'), null)
    assert.ok(parseMarks([{ t: 0, lane: 2 }]))
  })
})
