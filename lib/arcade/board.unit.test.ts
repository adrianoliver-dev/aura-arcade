import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { collapseByAlias, pickBetter, rankAttempt, rankValue, sortBoard, upsertBestByAlias } from './board'
import type { BoardEntry } from '@/lib/pulso/types'

function row(partial: Partial<BoardEntry> & Pick<BoardEntry, 'id' | 'alias' | 'score'>): BoardEntry {
  return {
    tag: 'SCZ',
    comboMax: 0,
    at: 1,
    ...partial,
  }
}

describe('arcade board', () => {
  it('no reescribe apodos al ordenar', () => {
    const sorted = sortBoard([
      row({ id: 'a', alias: 'Ronda', score: 83, at: 1 }),
      row({ id: 'b', alias: 'Patuju', score: 40, at: 2 }),
    ])
    assert.equal(sorted[0]?.alias, 'Ronda')
    assert.equal(sorted[1]?.alias, 'Patuju')
  })

  it('colapsa el mismo apodo y se queda con el mejor', () => {
    const collapsed = collapseByAlias([
      row({ id: 'a', alias: 'Yacare', score: 50, at: 1 }),
      row({ id: 'b', alias: 'yacare', score: 80, at: 2 }),
      row({ id: 'c', alias: 'Yacare', score: 40, at: 3 }),
    ])
    assert.equal(collapsed.length, 1)
    assert.equal(collapsed[0]?.score, 80)
    assert.equal(collapsed[0]?.id, 'b')
  })

  it('fusiona Ronda2…Ronda10 del uniquify viejo y deja Plan3000 intacto', () => {
    const clones = collapseByAlias([
      row({ id: 'a', alias: 'Ronda', score: 83, at: 1 }),
      row({ id: 'b', alias: 'Ronda2', score: 83, at: 2 }),
      row({ id: 'c', alias: 'Ronda10', score: 83, at: 3 }),
      row({ id: 'd', alias: 'Plan3000', score: 40, at: 4 }),
    ])
    const names = clones.map((entry) => entry.alias).sort()
    assert.deepEqual(names, ['Plan3000', 'Ronda'])
    assert.equal(clones.find((entry) => entry.alias === 'Ronda')?.id, 'a')
  })

  it('desempata HUMO con rankScore, no con hectáreas crudas', () => {
    const a = row({ id: 'a', alias: 'Uno', score: 83, rankScore: 83_000, at: 10 })
    const b = row({ id: 'b', alias: 'Dos', score: 83, rankScore: 90_000, at: 1 })
    assert.equal(pickBetter(a, b).id, 'b')
    assert.equal(sortBoard([a, b])[0]?.alias, 'Dos')
    assert.ok(rankValue(b) > rankValue(a))
  })

  it('upsert actualiza el id de la sesión y conserva el mejor score', () => {
    const first = [row({ id: 'run-1', alias: 'Motacu', score: 83, at: 1 })]
    const worse = upsertBestByAlias(first, row({ id: 'run-2', alias: 'Motacu', score: 40, at: 2 }))
    assert.equal(worse.length, 1)
    assert.equal(worse[0]?.score, 83)
    assert.equal(worse[0]?.id, 'run-2')
  })

  it('el puesto de la ronda usa el score de ahora, no el récord guardado', () => {
    const board = [
      row({ id: 'lead', alias: 'Patuju', score: 70, at: 1 }),
      row({ id: 'old', alias: 'Yacare', score: 83, at: 1 }),
    ]
    const attempt = row({ id: 'now', alias: 'Yacare', score: 40, at: 9 })
    const ranked = rankAttempt(board, attempt)
    assert.equal(ranked.rank, 2)
    assert.equal(ranked.total, 2)
  })
})
