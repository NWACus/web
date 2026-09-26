/**
 * Center-level warning aggregation — the data behind the home-page warnings banner.
 *
 * The warning source adapter is per-zone (that's the shape of the upstream product: one
 * `type=warning` query per zone). The home page needs the center-wide view, so this module fans
 * out across the center's zones and groups the results by product type, exactly as the legacy
 * `warnings` widget did.
 *
 * Two behaviours are deliberately carried over from the legacy widget, both erring toward showing
 * an alert rather than hiding one:
 * - **Every zone is queried, not just active ones.** A disabled zone has no native forecast page
 *   (its `slug` is null and the banner omits its link), but its alert is still surfaced.
 * - **Active-ness is the presence of a product**, not an expiry comparison. The model already
 *   collapses v2's "no active alert" null-object to plain `null`, so a falsy check is the test.
 */
import { createHash } from 'node:crypto'

import type { WarningProduct } from './model/forecast'
import { ProductType } from './model/forecast'
import { getAvalancheCenterMetadata, zoneSlugFromUrl } from './nac'
import { getWarningSource } from './sources'

/** The three product types the `type=warning` query can return, in banner order. */
const ALERT_ORDER = [ProductType.Warning, ProductType.Watch, ProductType.Special] as const

export type AlertProductType = (typeof ALERT_ORDER)[number]

export interface AffectedZone {
  id: number
  name: string
  /** Native forecast-page slug, or `null` for a zone with no forecast page (a disabled zone). */
  slug: string | null
}

/** One zone's alert lookup result — `null` when the zone has no active alert. */
export interface ZoneWarningLookup {
  zone: AffectedZone
  warning: WarningProduct | null
}

export interface CenterWarningEntry {
  zone: AffectedZone
  warning: WarningProduct
}

/** All zones sharing one alert type, rendered as a single banner. */
export interface CenterWarningGroup {
  productType: AlertProductType
  entries: CenterWarningEntry[]
}

function isAlertProductType(productType: ProductType): productType is AlertProductType {
  return ALERT_ORDER.some((type) => type === productType)
}

/**
 * Group per-zone lookups into one banner-worth of data per alert type, dropping zones with no
 * active alert. Groups come back in `ALERT_ORDER` (most severe first) and zones keep the order
 * they were passed in. Returns `[]` when nothing is active — the banner's normal state.
 */
export function groupWarningsByType(lookups: ZoneWarningLookup[]): CenterWarningGroup[] {
  const byType = new Map<AlertProductType, CenterWarningEntry[]>()

  for (const { zone, warning } of lookups) {
    if (!warning) continue
    if (!isAlertProductType(warning.product_type)) continue

    const entries = byType.get(warning.product_type) ?? []
    entries.push({ zone, warning })
    byType.set(warning.product_type, entries)
  }

  return ALERT_ORDER.flatMap((productType) => {
    const entries = byType.get(productType)
    return entries && entries.length > 0 ? [{ productType, entries }] : []
  })
}

async function lookupCenterWarnings(
  centerSlug: string,
  fetchOne: (zoneId: number) => Promise<WarningProduct | null>,
): Promise<CenterWarningGroup[]> {
  const metadata = await getAvalancheCenterMetadata(centerSlug)

  const lookups = await Promise.all(
    metadata.zones.map(async (zone): Promise<ZoneWarningLookup> => {
      const slug = zone.status === 'active' ? (zoneSlugFromUrl(zone.url) ?? null) : null
      return {
        zone: { id: zone.id, name: zone.name, slug },
        // A single zone's failure must not blank the whole banner.
        warning: await fetchOne(zone.id).catch(() => null),
      }
    }),
  )

  return groupWarningsByType(lookups)
}

/** The center's active alerts, grouped for the banner. `[]` when none are active. */
export async function getCenterWarnings(centerSlug: string): Promise<CenterWarningGroup[]> {
  const source = getWarningSource(centerSlug)
  return lookupCenterWarnings(centerSlug, (zoneId) => source.getWarning(centerSlug, zoneId))
}

/**
 * The center's active alerts fetched fresh from upstream (short-cached), for the freshness check.
 */
export async function getCenterWarningsFresh(centerSlug: string): Promise<CenterWarningGroup[]> {
  const source = getWarningSource(centerSlug)
  return lookupCenterWarnings(centerSlug, (zoneId) => source.getWarningFresh(centerSlug, zoneId))
}

/**
 * A content fingerprint for the center's whole alert set, used as the revalidate-on-view ETag.
 * Hashing the full grouped products (not just which zones are affected) means an alert issued,
 * lifted, upgraded, re-worded, or extended to another zone all change the fingerprint, so a
 * viewer's open home page refreshes. Server-only.
 */
export function centerWarningsFingerprint(groups: CenterWarningGroup[]): string {
  return createHash('sha1').update(JSON.stringify(groups)).digest('hex')
}
