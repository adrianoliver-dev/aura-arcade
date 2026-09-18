import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { HUMO_HA_CAP, humoLegacyBest } from './liga'

describe('liga PB', () => {
  it('descarta un humo:pb contaminado con pts de PULSO', () => {
    assert.equal(humoLegacyBest(28_575), 0)
    assert.equal(humoLegacyBest(32_413), 0)
    assert.equal(humoLegacyBest(83), 83)
    assert.equal(humoLegacyBest(140), 140)
    assert.equal(humoLegacyBest(0), 0)
    assert.ok(HUMO_HA_CAP < 1_000)
  })
})
