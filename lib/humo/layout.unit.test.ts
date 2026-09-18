import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { gridLayout } from '../../components/humo/humo-fx'

describe('layout del predio', () => {
  it('en 390×844 el predio ocupa 62–72% del alto', () => {
    const layout = gridLayout(390, 844)
    const ratio = layout.gridH / 844
    assert.ok(ratio >= 0.62 && ratio <= 0.72, String(ratio))
    assert.ok(layout.gridW / 390 >= 0.9)
  })

  it('en 1920×1080 el predio domina el encuadre', () => {
    const layout = gridLayout(1920, 1080)
    assert.ok(layout.gridH / 1080 >= 0.85, String(layout.gridH / 1080))
    assert.ok(layout.gridW / 1920 >= 0.55)
  })
})
