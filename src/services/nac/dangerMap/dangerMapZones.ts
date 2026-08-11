/**
 * How a forecast zone is drawn and described on the danger map.
 *
 * Everything here is pure: it turns one map-layer feature's properties into the colors the
 * polygon is painted with and the model the popup renders. The map component does the Mapbox
 * work; this module owns the rules, because the rules are where the bugs are — off-season
 * outranking a stale rating, an unrated zone ignoring the server's grey, naive timestamps that
 * are really UTC.
 *
 * **Parity target is the afp danger-map widget, not avy.** NAC has built this twice and the two
 * disagree: off-season is dark grey at 0.2 opacity here and blue in avy; no-rating is blue here
 * and grey in avy; the widget overrides the API's `fillOpacity` and avy honors it. AvyWeb sits on
 * the same sites as these embeds, so matching the embed is what a reader actually notices. See
 * `docs/nac-observations-and-danger-map-state.md` for the full comparison.
 */
import { TZDate } from '@date-fns/tz'
import { format } from 'date-fns/format'

import {
  NO_RATING_ADVICE,
  dangerLevelFromRating,
  dangerLevelLabel,
  dangerScaleRows,
} from '../dangerScale'
import type { ZoneFeature, ZoneProperties } from '../model/mapLayer'
import { DangerLevel } from '../types/forecastSchemas'
import { nativeZonePath } from '../zoneSlug'

export interface ZoneStyle {
  fillColor: string
  fillOpacity: number
  strokeColor: string
}

/**
 * Off-season: dark grey and nearly transparent, so the zone reads as "nothing to see here"
 * rather than as a rating. Takes precedence over every other rule.
 */
export const OFF_SEASON_STYLE: ZoneStyle = {
  fillColor: '#333333',
  fillOpacity: 0.2,
  strokeColor: '#333333',
}

/**
 * No rating: the widget's blue, deliberately *not* the grey the server sends in `color`, and
 * deliberately the opposite assignment to avy's (which paints off-season blue and no-rating grey).
 */
export const NO_RATING_STYLE: ZoneStyle = {
  fillColor: '#6ea4db',
  fillOpacity: 0.6,
  strokeColor: '#484848',
}

const STANDARD_FILL_OPACITY = 0.6
/** Extreme is darkened past the standard fill so the worst rating reads as the worst rating. */
const EXTREME_FILL_OPACITY = 0.8

/** Upstream sends lowercase danger strings; normalize anyway so a stray case never mis-styles. */
function dangerKey(properties: ZoneProperties): string {
  return (properties.danger ?? '').trim().toLowerCase()
}

export function zoneStyle(properties: ZoneProperties): ZoneStyle {
  if (properties.off_season) return OFF_SEASON_STYLE

  const danger = dangerKey(properties)
  if (danger === 'no rating') return NO_RATING_STYLE

  return {
    fillColor: properties.color ?? NO_RATING_STYLE.fillColor,
    fillOpacity: danger === 'extreme' ? EXTREME_FILL_OPACITY : STANDARD_FILL_OPACITY,
    strokeColor: properties.stroke ?? NO_RATING_STYLE.strokeColor,
  }
}

/**
 * Whether the zone has an avalanche warning in effect.
 *
 * The map layer's `warning` is filtered server-side to `product = 'warning'`, so watches and
 * special bulletins never reach it and a non-null product is a complete test — no cross-check
 * against the warnings endpoint needed. (The center-level banner reads that other endpoint
 * precisely because it returns all three types.)
 */
export function hasActiveWarning(properties: ZoneProperties): boolean {
  return Boolean(properties.warning?.product)
}

/**
 * The danger level the popup describes. A zone falls back to No Rating both when the rating is
 * the -1 sentinel and when there is no validity window at all — without an expiry there is
 * nothing vouching for the rating, so the popup declines to state one.
 */
export function popupDangerLevel(properties: ZoneProperties): DangerLevel {
  const { danger_level: level, end_date: endDate } = properties
  if (level == null || level < 0 || endDate == null) return DangerLevel.None
  return dangerLevelFromRating(level)
}

/** The danger scale's travel advice for a level — what the widget shows, keyed by rating. */
function adviceForLevel(level: DangerLevel): string {
  return dangerScaleRows.find((row) => row.level === level)?.advice ?? NO_RATING_ADVICE
}

/**
 * The map layer sends *naive* timestamps (`2026-01-14T01:30:00`) that are in fact UTC — the
 * products API formats them with `_format_naive_iso`, and every existing consumer parses them as
 * UTC. Read as local time they would drift by the viewer's offset. The product endpoints, by
 * contrast, send a real offset, so only add one when it is missing.
 */
function asUtcTimestamp(value: string): string {
  // Matches a trailing `Z` or a `+hh:mm` / `-hhmm` UTC offset.
  return /(?:Z|[+-]\d{2}:?\d{2})$/.test(value) ? value : `${value}Z`
}

/** The widget's "dddd, M/D h:mmA" published/expires format, in the zone's own timezone. */
function formatValidity(value: string | null | undefined, timezone: string | null | undefined) {
  if (!value) return null
  const date = new TZDate(asUtcTimestamp(value), timezone ?? 'UTC')
  if (isNaN(date.getTime())) return null
  return format(date, 'EEEE, M/d h:mma')
}

export interface ZonePopup {
  zoneName: string
  /** The zone's avalanche center, shown only on an all-centers map where zones differ. */
  centerName: string | null
  offSeason: boolean
  hasWarning: boolean
  dangerLevel: DangerLevel
  /** Popup title: the season-ended notice, or the zone's rating. */
  headline: string
  /** Qualifier under the headline; absent off-season, where the headline says it all. */
  subhead: string | null
  publishedText: string | null
  expiresText: string | null
  /** Travel advice as sanitizable HTML; null off-season or when the center disabled it. */
  advice: string | null
  /** Where "open this zone's forecast" goes — an AvyWeb path, or another center's own site. */
  href: string | null
  /** True when `href` leaves AvyWeb, so callers can open it in a new tab. */
  isExternal: boolean
}

export interface ZonePopupSettings {
  advice: boolean
  allCenters: boolean
  /** This site's avalanche center id, e.g. `NWAC` — decides which zones are our own. */
  centerId: string
}

/**
 * Where a zone's forecast link should point.
 *
 * Upstream's `link` is always the avalanche center's *own* website, which was right when the
 * widget was embedded there. On AvyWeb that would walk the reader off the site and past the native
 * forecast page, so this center's zones are rewritten to their AvyWeb route. Zones belonging to
 * another center — only reachable on an all-centers map — keep their external link.
 */
function resolveHref(
  properties: ZoneProperties,
  centerId: string,
): { href: string | null; isExternal: boolean } {
  const link = properties.link
  if (!link) return { href: null, isExternal: false }

  if (properties.center_id === centerId) {
    const path = nativeZonePath(link)
    if (path) return { href: path, isExternal: false }
  }

  return { href: link, isExternal: true }
}

export function zonePopup(properties: ZoneProperties, settings: ZonePopupSettings): ZonePopup {
  const offSeason = Boolean(properties.off_season)
  const dangerLevel = popupDangerLevel(properties)
  const unrated = dangerLevel === DangerLevel.None || dangerKey(properties) === 'no rating'

  return {
    zoneName: properties.name,
    centerName: settings.allCenters ? (properties.center ?? null) : null,
    offSeason,
    hasWarning: hasActiveWarning(properties),
    dangerLevel,
    headline: offSeason
      ? 'Forecasts ended for the season'
      : unrated
        ? 'No Rating'
        : dangerLevelLabel(dangerLevel),
    subhead: offSeason ? null : unrated ? 'Information Available' : 'Avalanche Danger',
    // Off-season the window would describe a forecast that ended months ago, so it is suppressed
    // rather than shown stale — the same call the widget makes.
    publishedText: offSeason ? null : formatValidity(properties.start_date, properties.timezone),
    expiresText: offSeason ? null : formatValidity(properties.end_date, properties.timezone),
    advice: offSeason || !settings.advice ? null : adviceForLevel(dangerLevel),
    ...resolveHref(properties, settings.centerId),
  }
}

/**
 * Per-feature style properties baked into the GeoJSON.
 *
 * The map draws all zones from one source with data-driven paint, so the paint expressions read
 * these precomputed values (`['get', 'fillColor']`) instead of re-deriving the rules above as
 * Mapbox expressions. That keeps `zoneStyle` the single source of truth — there is no second copy
 * of the precedence rules to drift out of sync, and no need for the map's paint to be tested
 * separately from the logic it renders.
 */
export interface ZoneRenderProperties extends ZoneProperties, ZoneStyle {
  hasWarning: boolean
}

export interface ZoneRenderFeature extends Omit<ZoneFeature, 'properties'> {
  properties: ZoneRenderProperties
}

/** Attach each zone's computed style to its feature, ready to hand to Mapbox as a source. */
export function decorateZoneFeatures(features: ZoneFeature[]): ZoneRenderFeature[] {
  return features.map((feature) => ({
    ...feature,
    properties: {
      ...feature.properties,
      ...zoneStyle(feature.properties),
      hasWarning: hasActiveWarning(feature.properties),
    },
  }))
}

/**
 * Which zones the map should frame when a center has no configured viewport.
 *
 * On an all-centers map, fit this center's own zones rather than the whole country — a NWAC reader
 * should land on Washington, not on a view where their zones are a speck. Falls back to the whole
 * set when none of them belong to this center, so the map is never framed on nothing.
 */
export function featuresToFit<T extends { properties: Pick<ZoneProperties, 'center_id'> }>(
  collection: { features: T[] } | null | undefined,
  centerId: string,
): T[] {
  const features = collection?.features ?? []
  const own = features.filter((feature) => feature.properties.center_id === centerId)
  return own.length > 0 ? own : features
}

/** `[[west, south], [east, north]]`, the shape Mapbox's `fitBounds` takes. */
export type ZoneBounds = [[number, number], [number, number]]

function isPosition(value: unknown): value is [number, number] {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    typeof value[0] === 'number' &&
    typeof value[1] === 'number' &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1])
  )
}

/**
 * The bounding box of a set of zones, or null when none has usable geometry.
 *
 * The map fits this when a center has no configured viewport. Polygon and MultiPolygon nest their
 * coordinates to different depths and the map layer returns both, so rather than branching on
 * `geometry.type` this walks the arrays until it reaches a `[lng, lat]` pair — which also means a
 * malformed coordinate is skipped instead of turning the whole box into NaN and blanking the map.
 */
export function zoneBounds(features: ZoneFeature[]): ZoneBounds | null {
  let west = Infinity
  let south = Infinity
  let east = -Infinity
  let north = -Infinity

  const visit = (node: unknown): void => {
    if (isPosition(node)) {
      const [lng, lat] = node
      west = Math.min(west, lng)
      east = Math.max(east, lng)
      south = Math.min(south, lat)
      north = Math.max(north, lat)
      return
    }
    if (Array.isArray(node)) node.forEach(visit)
  }

  for (const feature of features) {
    const geometry = feature.geometry
    if (geometry && typeof geometry === 'object' && 'coordinates' in geometry) {
      visit(geometry.coordinates)
    }
  }

  if (west === Infinity) return null
  return [
    [west, south],
    [east, north],
  ]
}
