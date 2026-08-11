/**
 * Normalized map-layer model — the forecast-zone geometry + danger overlay the danger map draws.
 *
 * The map layer is a Product in the ADR-018 sense, so it goes through a source adapter like
 * forecast and warning do (see `../sources/`). Consumers depend on this model, never on a v2 or
 * v3 response.
 *
 * One request carries everything the map needs: geometry, today's rating and the colors to paint
 * it in, the popup's travel advice and validity window, the forecast link, whether the zone is
 * off-season, and whether a warning is in effect. There is no zone tileset anywhere in the NAC
 * stack — every consumer draws these polygons from this GeoJSON.
 */

/** The active warning overlay, filtered server-side to warnings (never watches or specials). */
export interface ZoneWarningOverlay {
  /** `"warning"` when one is in effect, `null` otherwise. */
  product: string | null
}

/** Per-zone rendering and bulletin metadata. */
export interface ZoneProperties {
  name: string
  /** Avalanche center display name, e.g. "Northwest Avalanche Center". */
  center: string | null
  center_link: string | null
  /** IANA timezone the validity window is published in. */
  timezone: string | null
  center_id: string
  state: string | null
  /** The center's forecast season has ended — outranks any rating still in the response. */
  off_season: boolean
  travel_advice: string | null
  /** Lowercase rating name, e.g. `"considerable"`, `"no rating"`. */
  danger: string | null
  /** -1 (no rating) through 5 (extreme). */
  danger_level: number
  /** Server-supplied fill color for the rating. */
  color: string | null
  /** Server-supplied outline color. */
  stroke: string | null
  font_color: string | null
  /** The zone's forecast page URL. */
  link: string | null
  /** Publication time — a *naive* timestamp that is actually UTC. */
  start_date: string | null
  /** Expiry — likewise naive UTC. */
  end_date: string | null
  warning: ZoneWarningOverlay
}

/** A `[lng, lat]` pair (GeoJSON allows a third elevation value; zones never carry one). */
export type ZonePosition = [number, number, ...number[]]

/** Zone outlines are always polygons — products-api flattens anything more exotic server-side. */
export type ZoneGeometry =
  | { type: 'Polygon'; coordinates: ZonePosition[][] }
  | { type: 'MultiPolygon'; coordinates: ZonePosition[][][] }

export interface ZoneFeature {
  type: 'Feature'
  /**
   * Stable numeric zone id, at the feature level rather than inside `properties` — this is what
   * Mapbox's `setFeatureState` keys on. Null only if upstream omitted it, in which case that
   * zone renders but does not highlight on hover.
   */
  id: number | string | null
  /** The zone outline, or null when upstream sent a geometry that didn't validate. */
  geometry: ZoneGeometry | null
  properties: ZoneProperties
}

/** A center's forecast zones with today's (or a requested day's) danger overlay. */
export interface ZoneMapLayer {
  type: 'FeatureCollection'
  features: ZoneFeature[]
}
