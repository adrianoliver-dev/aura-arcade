import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { FetchTimeoutError, withTimeout } from './fetch-timeout'

describe('fetch timeout', () => {
  it('no bloquea ready si la promesa tarda', async () => {
    const slow = new Promise<string>((resolve) => {
      setTimeout(() => resolve('late'), 800)
    })
    await assert.rejects(() => withTimeout(slow, 40), FetchTimeoutError)
  })

  it('devuelve si llega a tiempo', async () => {
    const fast = Promise.resolve('ok')
    assert.equal(await withTimeout(fast, 200), 'ok')
  })
})
