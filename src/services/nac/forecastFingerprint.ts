import { createHash } from 'node:crypto'

import type { ForecastResult } from './model/forecast'

/**
 * A content fingerprint for a forecast/summary product, used as the revalidate-on-view ETag. Any
 * change to the normalized product — a correction, retraction, new bottom line, danger change,
 * replacement after expiry — changes the fingerprint, so a viewer's open page refreshes. Hashing
 * the whole normalized model means we never miss a safety-relevant change. Server-only.
 */
export function forecastFingerprint(forecast: ForecastResult): string {
  return createHash('sha1').update(JSON.stringify(forecast)).digest('hex')
}
