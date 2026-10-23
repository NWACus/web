/**
 * Where an old forecast-widget link lands on a native center (Forecast-244). While a center was on
 * the widget, its forecast pages were addressed by hash routes — `#/forecast/<zone_id>/<id>` for an
 * archived product, `#/<zone>/` for a zone, `#/archive/…` — and readers still hold those links from
 * the widget's archive and from sharing. The hash never reaches the server, so the native pages
 * read it in the browser (`LegacyWidgetHashHandOver`) and replace it with the native address.
 *
 * Pure and dependency-light so the client component and its tests share it.
 */
import {
  ARCHIVE_DANGER_PATH,
  ARCHIVE_PATH,
  ARCHIVE_WEATHER_PATH,
} from '@/services/nac/forecastArchive'

const FORECASTS_PATH = '/forecasts/avalanche'

/** What a native page needs to know to place a widget link. */
export interface WidgetHashContext {
  /** The center's active zones: the widget matched `#/<zone>/` against their names. */
  zones: { name: string; slug: string }[]
  /** Whether the center has an archived Mountain Weather page for `#/weather/<id>`. */
  weatherArchive: boolean
}

/** A native address, or an archived product the server has to place (`forecast-address`). */
export type WidgetHashTarget = { address: string } | { productId: number; zoneId: string }

/** The widget's archive tabs, and the native archive's. Its Posts tab has no native counterpart. */
const ARCHIVE_TABS: Record<string, string> = {
  forecast: ARCHIVE_PATH,
  visual: ARCHIVE_DANGER_PATH,
  weather: ARCHIVE_WEATHER_PATH,
}

// A product id, as the widget's archive links carry it: digits only.
const ID_PATTERN = /^\d+$/

/**
 * The native target for a widget hash, or null for anything else (no hash, a native page's own
 * hash, or a widget route with nothing to hand over to).
 */
export function widgetHashTarget(
  hash: string,
  context: WidgetHashContext,
): WidgetHashTarget | null {
  if (!hash.startsWith('#/')) return null
  // The route's segments, without the widget's in-hash query (`?zone=…`).
  const segments = hash.slice(2).split('?')[0].split('/').filter(Boolean).map(decodeSegment)
  const [first, second, third] = segments

  switch (first) {
    case undefined:
      return null
    case 'all':
      return { address: FORECASTS_PATH }
    case 'archive':
      return { address: ARCHIVE_TABS[second] ?? ARCHIVE_PATH }
    case 'forecast':
      return second && third && ID_PATTERN.test(third)
        ? { productId: Number(third), zoneId: second }
        : null
    case 'weather':
      return weatherTarget(second, context)
    default:
      return zoneTarget(first, context)
  }
}

/** An archived weather product opens on its own page where the center has one, else the archive. */
function weatherTarget(
  id: string | undefined,
  context: WidgetHashContext,
): WidgetHashTarget | null {
  if (!id || !ID_PATTERN.test(id)) return null
  return { address: context.weatherArchive ? `${ARCHIVE_WEATHER_PATH}/${id}` : ARCHIVE_PATH }
}

/**
 * `#/<zone>/`, the zone's name lowercased with hyphens for spaces. That isn't always AvyWeb's slug,
 * which comes from the zone's URL, so match by name, as the widget did.
 */
function zoneTarget(param: string, context: WidgetHashContext): WidgetHashTarget | null {
  const name = widgetZoneName(param)
  const zone = context.zones.find((z) => z.name.toLowerCase() === name)
  return zone ? { address: `${FORECASTS_PATH}/${zone.slug}` } : null
}

/** The widget's own reading of a zone segment: hyphens back to spaces, lowercased. */
function widgetZoneName(param: string): string {
  return param.replace(/-/g, ' ').toLowerCase()
}

/** A malformed escape in a hand-edited link matches nothing rather than throwing. */
function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}

/** The address an archived product's hand-over asks the server for. */
export function forecastAddressEndpoint(centerSlug: string, productId: number, zoneId: string) {
  const query = new URLSearchParams({ id: String(productId), zone: zoneId })
  return `/api/${centerSlug}/forecast-address?${query}`
}

/** Where an archived product the server can't place goes: the archive, never the live page. */
export const UNPLACED_PRODUCT_ADDRESS = ARCHIVE_PATH
