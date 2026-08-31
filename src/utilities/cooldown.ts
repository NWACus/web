/**
 * A per-key, in-process rate limiter for effects that are worth doing once and pointless — or
 * expensive — repeated: purging a statically generated path, reporting that upstream is degraded.
 *
 * It is deliberately not a quota. Serverless instances come and go and Fluid Compute reuses one
 * across concurrent requests, so the real ceiling is (live instances × one per window), not a
 * global one. That is the right shape for the job here: the point is to stop an unauthenticated
 * caller turning one cheap request into one expensive effect, not to enforce an exact number.
 * Anything needing a true global limit belongs in the WAF or a shared store, not here.
 *
 * Keys must come from a bounded set — a tenant slug, a failure cause — because nothing evicts them.
 */
export function createCooldown(windowMs: number): (key: string) => boolean {
  const lastAllowedAt = new Map<string, number>()

  /** True the first time it is asked about a key, and again once `windowMs` has passed. */
  return function allow(key: string): boolean {
    const now = Date.now()
    const previous = lastAllowedAt.get(key)
    if (previous !== undefined && now - previous < windowMs) return false

    lastAllowedAt.set(key, now)
    return true
  }
}
