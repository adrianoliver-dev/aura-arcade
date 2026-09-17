import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

export type RunTokenPayload = {
  runId: string
  seed: number
  issuedAt: number
}

const MAX_AGE_MS = 8 * 60 * 1000

function secret(): string {
  const s = process.env.PULSO_RUN_SECRET?.trim()
  if (s) return s
  if (process.env.NODE_ENV !== 'production') return 'pulso-dev-secret-not-for-prod'
  return 'aura-pulso-fexpocruz-2026'
}

function signBody(body: string): string {
  return createHmac('sha256', secret()).update(body).digest('hex')
}

export function issueRunToken(payload: RunTokenPayload): string {
  const body = `${payload.runId}:${payload.seed}:${payload.issuedAt}`
  return `${body}:${signBody(body)}`
}

export function newRunId(): string {
  return randomBytes(12).toString('hex')
}

export function verifyRunToken(token: string): RunTokenPayload | null {
  const parts = token.split(':')
  if (parts.length !== 4) return null
  const [runId, seedRaw, issuedRaw, mac] = parts
  if (!runId || !seedRaw || !issuedRaw || !mac) return null
  const body = `${runId}:${seedRaw}:${issuedRaw}`
  const expected = signBody(body)
  const a = Buffer.from(mac, 'hex')
  const b = Buffer.from(expected, 'hex')
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  const seed = Number(seedRaw)
  const issuedAt = Number(issuedRaw)
  if (!Number.isInteger(seed) || !Number.isFinite(issuedAt)) return null
  if (Date.now() - issuedAt > MAX_AGE_MS) return null
  return { runId, seed, issuedAt }
}
