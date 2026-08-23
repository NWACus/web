/**
 * The three answers a freshness endpoint can give, and the cache policy each one carries.
 *
 * The freshness routes are content-addressed — the fingerprint of what the viewer rendered is a
 * path segment, not a request header — so their responses are cacheable at the edge. Which ones
 * *may* be cached is the safety-critical part:
 *
 * - **Unchanged** is the only cacheable answer. Every viewer inside an ISR window rendered the same
 *   product and so sends the same fingerprint, which makes this one cache key per zone answering
 *   almost all real traffic. It is also the only entry that can go stale, and its TTL is the whole
 *   staleness budget (30s here + the 30s fresh-fetch cache = the same 60s as before content
 *   addressing).
 * - **Changed** is rare in real traffic but unbounded under abuse: anyone can ask about a random
 *   40-hex fingerprint, and every one of those is a guaranteed miss and a new edge entry. Not
 *   caching it removes that pollution vector for free, and guarantees the answer always reaches
 *   origin — so the `revalidateTag` purge that rides along with it is an invariant rather than a
 *   side effect of a cache miss.
 * - **Indeterminate** means we could not establish the current product at all — upstream error,
 *   parse failure, or genuinely nothing published. It reports "no change" because blanking a
 *   last-known-good product on a transient blip is the dangerous direction, but it must never be
 *   cached: a blip cached as "you're current" would blind every viewer at that POP for the full
 *   TTL. `no-store` means the next viewer retries immediately.
 */
import { NextResponse } from 'next/server'

import { NO_STORE } from './apiResponses'

/** Server-derived sha1 hex. Anything else never came from one of our pages. */
const FINGERPRINT_PATTERN = /^[a-f0-9]{40}$/

/** The answer body, shared by the routes and by the client that reads it. */
export interface FreshnessAnswer {
  /** True only when the viewer's render is genuinely behind the current product. */
  changed: boolean
  /** The current product's fingerprint, present only when `changed`. */
  etag?: string
  /** Why an unchanged answer is not a positive one. */
  reason?: 'indeterminate'
}

/** Total on-view detection lag is this plus the sources' fresh-fetch cache window. */
const UNCHANGED_EDGE_TTL_SECONDS = 30

export function isFingerprint(value: string): boolean {
  return FINGERPRINT_PATTERN.test(value)
}

/** The viewer's render is current. The one answer that is safe to serve from the edge. */
export function unchangedResponse(): NextResponse {
  return NextResponse.json({ changed: false } satisfies FreshnessAnswer, {
    headers: { 'Cache-Control': `public, max-age=0, s-maxage=${UNCHANGED_EDGE_TTL_SECONDS}` },
  })
}

/** The product has moved on; this viewer must re-render. */
export function changedResponse(etag: string): NextResponse {
  return NextResponse.json({ changed: true, etag } satisfies FreshnessAnswer, {
    headers: NO_STORE,
  })
}

/** We could not establish the current product. Hold the last-known-good, and ask again next view. */
export function indeterminateResponse(): NextResponse {
  return NextResponse.json({ changed: false, reason: 'indeterminate' } satisfies FreshnessAnswer, {
    headers: NO_STORE,
  })
}

/** A fingerprint that isn't sha1 hex didn't come from one of our pages. */
export function malformedFingerprintResponse(): NextResponse {
  return NextResponse.json({ error: 'Malformed fingerprint' }, { status: 400, headers: NO_STORE })
}
