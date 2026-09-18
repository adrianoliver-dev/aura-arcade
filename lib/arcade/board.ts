/** Ranking puro: una fila por apodo, el mejor score. Sin mutar nombres. */

import type { BoardEntry } from '@/lib/pulso/types'

export const TOP_N = 50
export const TODAY_N = 10
export const FAIR_N = 5

export function rankValue(entry: Pick<BoardEntry, 'score' | 'rankScore'>): number {
  return typeof entry.rankScore === 'number' && Number.isFinite(entry.rankScore) ? entry.rankScore : entry.score
}

export function pickBetter(a: BoardEntry, b: BoardEntry): BoardEntry {
  const ra = rankValue(a)
  const rb = rankValue(b)
  if (rb > ra) return b
  if (ra > rb) return a
  if (b.score > a.score) return b
  if (a.score > b.score) return a
  return a.at <= b.at ? a : b
}

function aliasKey(alias: string): string {
  return alias.trim().toLowerCase()
}

function mergeKey(alias: string, present: Set<string>): string {
  const key = alias.trim().toLowerCase()
  const match = key.match(/^(.*[^\d])(\d{1,2})$/)
  const base = match?.[1]
  if (base && present.has(base)) return base
  return key
}

export function collapseByAlias(entries: BoardEntry[]): BoardEntry[] {
  const present = new Set(entries.map((row) => row.alias.trim().toLowerCase()))
  const map = new Map<string, BoardEntry>()
  for (const row of entries) {
    const key = mergeKey(row.alias, present)
    if (!key) continue
    const prev = map.get(key)
    map.set(key, prev ? pickBetter(prev, row) : row)
  }
  return [...map.values()]
}

export function sortBoard(entries: BoardEntry[]): BoardEntry[] {
  return collapseByAlias(entries)
    .sort((a, b) => rankValue(b) - rankValue(a) || b.score - a.score || a.at - b.at)
    .slice(0, TOP_N)
}

export function upsertBestByAlias(list: BoardEntry[], entry: BoardEntry): BoardEntry[] {
  const key = aliasKey(entry.alias)
  const i = list.findIndex((row) => aliasKey(row.alias) === key)
  if (i < 0) return [...list, entry]
  const prev = list[i]!
  const winner = pickBetter(prev, entry)
  const next: BoardEntry = {
    ...winner,
    id: entry.id,
    alias: entry.alias,
    tag: entry.tag || winner.tag,
  }
  const copy = list.slice()
  copy[i] = next
  return copy
}

/** Puesto de ESTA ronda entre los mejores de los demás. El board guarda el máximo. */
export function rankAttempt(board: BoardEntry[], attempt: BoardEntry): { rank: number; total: number; gap: number } {
  const others = collapseByAlias(board).filter((row) => aliasKey(row.alias) !== aliasKey(attempt.alias))
  const sorted = sortBoard([...others, attempt])
  const idx = sorted.findIndex((row) => row.id === attempt.id)
  const rank = idx >= 0 ? idx + 1 : sorted.filter((row) => rankValue(row) > rankValue(attempt)).length + 1
  const ahead = idx > 0 ? sorted[idx - 1] : null
  const gap = ahead ? Math.max(0, ahead.score - attempt.score) : 0
  return { rank, total: sorted.length, gap }
}
