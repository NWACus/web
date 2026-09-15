/**
 * The freshness address for one forecast zone: the URL a page asks about, and the fingerprint that
 * fills it in. Both live here so the route's path shape and its callers cannot drift apart — the
 * live forecast page and the all-zones grid ask the very same address for a given zone, which is
 * what lets them share its edge cache entry. Server-only.
 */
import { createHash } from 'node:crypto'

import type { ForecastResult, WarningProduct } from './model/forecast'

function sha1(value: unknown): string {
  return createHash('sha1').update(JSON.stringify(value)).digest('hex')
}

/**
 * The address a forecast page asks freshness about: a fingerprint of everything safety-critical the
 * page rendered — the forecast AND the zone's active warning. Hashing the whole normalized products
 * rather than a timestamp means no category of change can be missed: a correction, a retraction, a
 * new bottom line, a danger change, a replacement after expiry, an alert issued or lifted.
 *
 * The warning belongs in the same address because it sits on the same page and turns over
 * independently of the forecast. An alert issued for this zone changes nothing about the forecast,
 * so a forecast-only address would leave an open tab showing no banner until the page's ISR window
 * came round — on the one product whose whole point is that it is urgent.
 *
 * `null` on either side is a state the page can render too, and it has to be able to ask about it:
 * a first publish into a zone that had nothing, or a first alert, is exactly the change an open tab
 * most needs to be told about. Hashing them gives those absent states their own stable addresses.
 * Server-only.
 */
export function forecastPageFingerprint(
  forecast: ForecastResult | null,
  warning: WarningProduct | null,
): string {
  return sha1({ forecast, warning })
}

/**
 * One product's fingerprint, for the freshness route's per-product purge decisions. The forecast
 * tag and the warning tag are revalidated independently — a warning-only change must not force an
 * upstream forecast re-fetch — so each side needs its own comparison against what the shared cache
 * is serving. This is not an address; pages ask about the pair above.
 */
export function productFingerprint(product: ForecastResult | WarningProduct | null): string {
  return sha1(product)
}

/**
 * The freshness endpoint a page asks about a zone.
 *
 * The center is in the path rather than inferred, because `/api` is excluded from the middleware
 * matcher and so is never rewritten the way an in-app page path is. That exclusion is what makes
 * the answer cacheable at all: no middleware means no `payload-tenant` `Set-Cookie` on the
 * response, and Vercel's CDN will not cache a response that carries one.
 *
 * The zone slug is encoded, so a slug carrying a `/` cannot forge extra path segments.
 */
export function forecastFreshnessEndpoint(
  centerSlug: string,
  zoneSlug: string,
  forecast: ForecastResult | null,
  warning: WarningProduct | null,
): string {
  const fingerprint = forecastPageFingerprint(forecast, warning)
  return `/api/${centerSlug}/forecast-freshness/${encodeURIComponent(zoneSlug)}/${fingerprint}`
}
