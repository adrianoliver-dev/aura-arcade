import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { qrSvg } from '../pulso/qr'
import { arcadePlayHostLabel, arcadeQrTarget, HUMO_PLAY_URL, PULSO_PUBLIC_URL } from '../pulso/social'

describe('QR de stand', () => {
  it('abre /jugar y no la raíz del dominio', () => {
    assert.equal(arcadeQrTarget('https://arcade.example'), 'https://arcade.example/jugar')
    assert.equal(arcadeQrTarget('https://arcade.example/'), 'https://arcade.example/jugar')
    assert.equal(arcadeQrTarget('https://arcade.example/jugar'), 'https://arcade.example/jugar')
    assert.equal(arcadeQrTarget(PULSO_PUBLIC_URL), HUMO_PLAY_URL)
    assert.match(arcadeQrTarget(), /\/jugar$/)
    assert.equal(arcadePlayHostLabel('https://aura.ia.bo/jugar'), 'aura.ia.bo/jugar')
  })

  it('genera un SVG con quiet zone blanco', () => {
    const svg = qrSvg(arcadeQrTarget(), 280)
    assert.match(svg, /<svg /)
    assert.match(svg, /fill="#fff"/)
    assert.ok(svg.length > 800)
  })
})
