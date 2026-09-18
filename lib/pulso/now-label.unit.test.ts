import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { pulsoNowLabelFits, pulsoNowLabelY } from './now-label'

describe('señal ¡AHORA! de PULSO', () => {
  it('cabe en monitor 16:9, teléfono y short 9:16', () => {
    const frames: [number, number][] = [
      [1920, 1080],
      [390, 844],
      [1080, 1920],
      [608, 1080],
    ]
    for (const [w, h] of frames) {
      assert.ok(pulsoNowLabelFits(w, h), `${w}x${h} y=${pulsoNowLabelY(w, h)}`)
      const y = pulsoNowLabelY(w, h)
      assert.ok(y < h * 0.28, `demasiado baja en ${w}x${h}: ${y}`)
    }
  })

  it('en 16:9 no usa el ancla vieja que caía fuera del canvas', () => {
    const w = 1920
    const h = 1080
    const size = Math.min(w, h)
    const cy = (h - size) / 2 + 0.5 * size
    const legacy = cy - size * 0.57
    assert.ok(legacy < 0, `la fórmula vieja debía recortarse, obtuvo ${legacy}`)
    assert.ok(pulsoNowLabelY(w, h) > 0)
  })
})
