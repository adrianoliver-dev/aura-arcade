const hits = new Map<string, number[]>()

export function clientIp(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0]!.trim().slice(0, 80)
  return request.headers.get('x-real-ip')?.trim() || 'local'
}

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const prev = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
  if (prev.length >= max) {
    hits.set(key, prev)
    return false
  }
  prev.push(now)
  hits.set(key, prev)
  return true
}
