import { createHash } from 'node:crypto'

import type { ForecastResult } from './model/forecast'

/**
 * A content fingerprint for a forecast/summary product, used as the revalidate-on-view address. Any
 * change to the normalized product — a correction, retraction, new bottom line, danger change,
 * replacement after expiry — changes the fingerprint, so a viewer's open page refreshes. Hashing
 * the whole normalized model means we never miss a safety-relevant change. Server-only.
 *
 * `null` — nothing published for this zone — is a state the page can render too, and it has to be
 * able to ask about it: a first publish is exactly the change an open tab most needs to be told
 * about. Hashing it gives the absent state its own stable address.
 */
export function forecastFingerprint(forecast: ForecastResult | null): string {
  return createHash('sha1').update(JSON.stringify(forecast)).digest('hex')
}
