/**
 * The station map's per-center configuration, normalized.
 *
 * Forecasters configure their station map in dashboard-v2 (Settings → Stations), which writes to
 * `widget_config.stations` on the center's NAC metadata. This resolves that raw object the way
 * dashboard-v2's `buildStationsInitialState` does, so a center sees the same map here as in its
 * legacy embed, and one that never opened the page gets the dashboard's defaults.
 *
 * `saturation`, `color_rules`, `timezone` and `external_modal_links` are deliberately not
 * resolved. Saturation only ever styled the Google base map this replaces; color rules highlight
 * table values (the table is the native station pages' job); the timezone toggle is unused by the
 * legacy map, which formats in browser time; and the modal links pointed at the legacy nwac.us
 * pages the native station pages have superseded.
 */
import { mapboxZoomFor } from '@/services/nac/dangerMap/dangerMapSettings'
import type { AvalancheCenterStationsWidgetConfiguration } from '@/services/nac/types/schemas'

export interface StationMapViewport {
  lat: number
  lng: number
}

export interface StationMapSettings {
  /** Opening viewport. */
  center: StationMapViewport
  /** Opening zoom, already converted to Mapbox's tile scale. */
  zoom: number
  /** A reading older than this many minutes is flagged as stale in its card. */
  within: number
  /** Show the clickable data-source legend. */
  sourceLegend: boolean
  /** Color markers by data source; off paints every station the same. */
  sourceMarkerColor: boolean
  /**
   * The KML URL of the center's own station groupings (SAC, SNFAC and BTAC have one). When set,
   * stations are grouped, filtered and framed by those polygons instead of the forecast zones.
   */
  alternateZones: string | null
}

/** Dashboard-v2's `STATIONS_DEFAULTS`, for a center that never opened the settings page. */
export const STATION_MAP_DEFAULTS: StationMapSettings = {
  center: { lat: 44.0, lng: -114.7 },
  zoom: mapboxZoomFor(9),
  within: 180,
  sourceLegend: false,
  sourceMarkerColor: true,
  alternateZones: null,
}

/** The recency choices the dashboard offers, in minutes. */
const WITHIN_CHOICES = [60, 180, 360, 720, 1440]

function finiteOr(value: unknown, fallback: number): number {
  const n = typeof value === 'number' || typeof value === 'string' ? Number(value) : NaN
  return Number.isFinite(n) ? n : fallback
}

/** `within` arrives as a string from the API and a number from the dashboard; both are valid. */
function resolveWithin(value: string | number | undefined): number {
  const within = finiteOr(value, STATION_MAP_DEFAULTS.within)
  return WITHIN_CHOICES.includes(within) ? within : STATION_MAP_DEFAULTS.within
}

export function resolveStationMapSettings(
  config: AvalancheCenterStationsWidgetConfiguration | undefined,
): StationMapSettings {
  if (!config) return STATION_MAP_DEFAULTS

  return {
    center: {
      lat: finiteOr(config.center?.lat, STATION_MAP_DEFAULTS.center.lat),
      lng: finiteOr(config.center?.lng, STATION_MAP_DEFAULTS.center.lng),
    },
    zoom:
      typeof config.zoom === 'number' && Number.isFinite(config.zoom)
        ? mapboxZoomFor(config.zoom)
        : STATION_MAP_DEFAULTS.zoom,
    within: resolveWithin(config.within),
    sourceLegend: Boolean(config.source_legend),
    // Defaults on, as dashboard-v2 treats an unset value.
    sourceMarkerColor: config.source_marker_color === undefined ? true : config.source_marker_color,
    alternateZones:
      typeof config.alternate_zones === 'string' && config.alternate_zones.length > 0
        ? config.alternate_zones
        : null,
  }
}
