/**
 * Leaderboard del arcade.
 * Prod: PULSO_KV_URL + PULSO_KV_TOKEN (Upstash REST) y PULSO_RUN_SECRET.
 * Dev sin KV: archivo `.data/arcade.json`.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { FAIR_N, TODAY_N, rankAttempt, sortBoard, upsertBestByAlias } from '@/lib/arcade/board'
import type { BoardEntry, InterestPing } from '@/lib/pulso/types'

export type { BoardEntry, InterestPing }

type StoreShape = {
  boards: Record<string, BoardEntry[]>
  usedRuns: Record<string, { seed: number; score: number; at: number }>
  interest: InterestPing[]
}

const FILE = path.join(process.cwd(), '.data', 'arcade.json')

export type ArcadeGameId = 'humo' | 'anillos' | 'radio'

function todayKey(game: ArcadeGameId, now = Date.now()): string {
  const day = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/La_Paz',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(now))
  return `${game}-today:${day}`
}

function fairKey(game: ArcadeGameId): string {
  return `${game}-fair`
}

function kvUrl(): string | undefined {
  return process.env.PULSO_KV_URL?.trim() || process.env.UPSTASH_REDIS_REST_URL?.trim() || undefined
}

function kvToken(): string | undefined {
  return process.env.PULSO_KV_TOKEN?.trim() || process.env.UPSTASH_REDIS_REST_TOKEN?.trim() || undefined
}

function kvEnabled(): boolean {
  return Boolean(kvUrl() && kvToken())
}

function fileEnabled(): boolean {
  return !kvEnabled()
}

let memory: StoreShape = { boards: {}, usedRuns: {}, interest: [] }

async function redis(cmd: (string | number)[]): Promise<unknown> {
  const url = kvUrl()
  const token = kvToken()
  if (!url || !token) throw new Error('kv missing')
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(cmd),
  })
  const json = (await res.json()) as { result?: unknown; error?: string }
  if (!res.ok || json.error) throw new Error(json.error || `kv ${res.status}`)
  return json.result
}

async function readFileStore(): Promise<StoreShape> {
  try {
    const raw = await readFile(FILE, 'utf8')
    const parsed = JSON.parse(raw) as StoreShape
    return {
      boards: parsed.boards ?? {},
      usedRuns: parsed.usedRuns ?? {},
      interest: parsed.interest ?? [],
    }
  } catch {
    return { boards: {}, usedRuns: {}, interest: [] }
  }
}

async function writeFileStore(data: StoreShape): Promise<void> {
  try {
    await mkdir(path.dirname(FILE), { recursive: true })
    await writeFile(FILE, JSON.stringify(data), 'utf8')
  } catch {
    /* contenedor de prod a veces es de solo lectura */
  }
}

async function getBoard(key: string): Promise<BoardEntry[]> {
  if (kvEnabled()) {
    const raw = (await redis(['GET', `pulso:${key}`])) as string | null
    if (!raw) return []
    try {
      return sortBoard(JSON.parse(raw) as BoardEntry[])
    } catch {
      return []
    }
  }
  const store = fileEnabled() ? await readFileStore() : memory
  return sortBoard(store.boards[key] ?? [])
}

async function setBoard(key: string, entries: BoardEntry[]): Promise<void> {
  const next = sortBoard(entries)
  if (kvEnabled()) {
    await redis(['SET', `pulso:${key}`, JSON.stringify(next)])
    return
  }
  if (fileEnabled()) {
    const store = await readFileStore()
    store.boards[key] = next
    await writeFileStore(store)
    return
  }
  memory.boards[key] = next
}

export async function markRunUsed(runId: string, seed: number, score: number): Promise<boolean> {
  const rec = { seed, score, at: Date.now() }
  if (kvEnabled()) {
    const ok = await redis(['SET', `pulso:run:${runId}`, JSON.stringify(rec), 'NX', 'EX', 86_400])
    return ok === 'OK'
  }
  if (fileEnabled()) {
    const store = await readFileStore()
    if (store.usedRuns[runId]) return false
    store.usedRuns[runId] = rec
    await writeFileStore(store)
    return true
  }
  if (memory.usedRuns[runId]) return false
  memory.usedRuns[runId] = rec
  return true
}

export async function runWasUsed(runId: string): Promise<boolean> {
  if (kvEnabled()) {
    const raw = await redis(['GET', `pulso:run:${runId}`])
    return raw != null
  }
  if (fileEnabled()) {
    const store = await readFileStore()
    return Boolean(store.usedRuns[runId])
  }
  return Boolean(memory.usedRuns[runId])
}

export async function saveScore(
  entry: BoardEntry,
  game: ArcadeGameId,
): Promise<{
  rank: number
  total: number
  gap: number
  today: BoardEntry[]
  fair: BoardEntry[]
  alias: string
}> {
  const unique: BoardEntry = {
    ...entry,
    rankScore: entry.rankScore ?? entry.score,
  }
  const day = todayKey(game, unique.at)
  const today = await getBoard(day)
  const fair = await getBoard(fairKey(game))
  const ranked = rankAttempt(today, unique)
  const todayNext = upsertBestByAlias(today, unique)
  const fairNext = upsertBestByAlias(fair, unique)
  await setBoard(day, todayNext)
  await setBoard(fairKey(game), fairNext)
  return {
    ...ranked,
    today: sortBoard(todayNext).slice(0, TODAY_N),
    fair: sortBoard(fairNext).slice(0, FAIR_N),
    alias: unique.alias,
  }
}

export async function updateAlias(
  runId: string,
  alias: string,
  tag: string,
  game: ArcadeGameId,
): Promise<BoardEntry | null> {
  const patch = async (key: string) => {
    const list = await getBoard(key)
    const i = list.findIndex((e) => e.id === runId)
    if (i < 0) return null
    const current = list[i]!
    const renamed = { ...current, alias, tag }
    const without = list.filter((_, idx) => idx !== i)
    await setBoard(key, upsertBestByAlias(without, renamed))
    return renamed
  }
  const todayHit = await patch(todayKey(game))
  const fairHit = await patch(fairKey(game))
  return todayHit ?? fairHit
}

export async function readLeaderboard(game: ArcadeGameId): Promise<{
  today: BoardEntry[]
  fair: BoardEntry[]
  lastInterest: InterestPing | null
}> {
  const today = sortBoard(await getBoard(todayKey(game))).slice(0, TODAY_N)
  const fair = sortBoard(await getBoard(fairKey(game))).slice(0, FAIR_N)
  let lastInterest: InterestPing | null = null
  if (kvEnabled()) {
    const raw = (await redis(['GET', 'pulso:interest:last'])) as string | null
    if (raw) {
      try {
        lastInterest = JSON.parse(raw) as InterestPing
      } catch {
        lastInterest = null
      }
    }
  } else if (fileEnabled()) {
    const store = await readFileStore()
    lastInterest = store.interest.at(-1) ?? null
  } else {
    lastInterest = memory.interest.at(-1) ?? null
  }
  return { today, fair, lastInterest }
}

export async function recordInterest(source: string): Promise<InterestPing> {
  const ping: InterestPing = { at: Date.now(), source: source.slice(0, 40) }
  if (kvEnabled()) {
    await redis(['SET', 'pulso:interest:last', JSON.stringify(ping)])
    return ping
  }
  if (fileEnabled()) {
    const store = await readFileStore()
    store.interest.push(ping)
    store.interest = store.interest.slice(-40)
    await writeFileStore(store)
    return ping
  }
  memory.interest.push(ping)
  memory.interest = memory.interest.slice(-40)
  return ping
}
