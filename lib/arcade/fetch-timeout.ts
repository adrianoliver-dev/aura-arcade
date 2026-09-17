/** Fetch con timeout. El boot nunca espera una API infinita. */

export class FetchTimeoutError extends Error {
  constructor(message = 'timeout') {
    super(message)
    this.name = 'FetchTimeoutError'
  }
}

export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new FetchTimeoutError()), timeoutMs)
  })
  try {
    return await Promise.race([promise, timeout])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<Response> {
  const { timeoutMs = 2_500, signal, ...rest } = init
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  if (signal) {
    if (signal.aborted) ctrl.abort()
    else signal.addEventListener('abort', () => ctrl.abort(), { once: true })
  }
  try {
    return await withTimeout(fetch(input, { ...rest, signal: ctrl.signal }), timeoutMs + 80)
  } catch (err) {
    if (ctrl.signal.aborted || (err instanceof Error && err.name === 'FetchTimeoutError')) {
      throw new FetchTimeoutError()
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

export const BOOT_BUDGET_MS = 1_200
export const FETCH_BUDGET_MS = 2_500
