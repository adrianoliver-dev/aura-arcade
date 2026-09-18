import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { heatFromXp, heatLabel, missionFor, xpFromScore } from './progress'

describe('arcade progress', () => {
  it('sube el calor con XP, no con un round', () => {
    assert.equal(heatFromXp(0), 1)
    assert.equal(heatFromXp(199), 1)
    assert.equal(heatFromXp(200), 2)
    assert.equal(heatFromXp(2200), 5)
    assert.equal(heatLabel(3), 'Calor 3')
  })

  it('da XP por score y misiones por juego', () => {
    assert.ok(xpFromScore(120) >= 10)
    assert.ok(missionFor('anillos', 1).label.length > 3)
    assert.ok(missionFor('radio', 5).hint.length > 3)
  })
})
