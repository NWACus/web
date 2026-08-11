/**
 * The danger map's per-center configuration, normalized.
 *
 * Forecasters configure their danger map in dashboard-v2 (Settings → Map), which writes to
 * `widget_config.danger_map` on the center's NAC metadata. This resolves that raw object into the
 * settings the native map renders from, matching dashboard-v2's own normalization in
 * `app/utils/dangerMapSettings.js` field for field — so a forecaster who set something there sees
 * it here, and a center that never opened the page gets the same defaults the dashboard shows.
 *
 * **`saturation` is deliberately not resolved.** The dashboard offers a "Map color" control
 * (full / light / grayscale) and every center has picked grayscale, but *no* Mapbox consumer
 * applies it — not the afp danger-map widget, not dashboard-v2's own map preview. The only
 * saturation code in the NAC stack styles the Google-Maps-based stations map. The shared
 * "AFP Custom" Mapbox style is already near-grayscale (neutral grey land and hillshade, blue
 * water), which is why nobody noticed. Honoring it here would mean rewriting the colour
 * expressions of 144 style layers at runtime and would make AvyWeb the only surface where the
 * control does anything — a divergence, not parity. Left inert, as everywhere else.
 */
import type { AvalancheCenterDangerMapWidgetConfiguration } from '../types/schemas'

export interface DangerMapViewport {
  lat: number
  lng: number
}

export interface DangerMapSettings {
  /** Map height in px, clamped to the range the dashboard's input allows. */
  height: number
  /** Show the location search box. */
  search: boolean
  /** Show the "find my location" control. */
  geolocate: boolean
  /** Render travel advice in the zone popup. */
  advice: boolean
  /** Draw every NAC center's zones, not just this center's. */
  allCenters: boolean
  /** Fixed opening viewport, or `null` to fit the center's own zones instead. */
  center: DangerMapViewport | null
  zoom: number
}

/** Dashboard-v2's `DANGER_MAP_DEFAULTS`, for a center that never opened the settings page. */
export const DANGER_MAP_DEFAULTS: DangerMapSettings = {
  height: 500,
  search: false,
  geolocate: false,
  advice: false,
  allCenters: false,
  center: null,
  zoom: 8,
}

const MIN_HEIGHT = 300
const MAX_HEIGHT = 1000

/** Height comes back as a string from the API and a number from the dashboard; both are valid. */
function clampHeight(value: string | number | undefined): number {
  const height = Number(value)
  if (!Number.isFinite(height)) return DANGER_MAP_DEFAULTS.height
  return Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, Math.round(height)))
}

/**
 * A viewport only counts as configured when both coordinates are real numbers — the dashboard
 * stores `{lat: null, lng: null}` for "unset", and a half-filled pair would fly the map to the
 * equator. Anything short of a complete pair falls back to fitting the center's zones.
 */
function resolveViewport(
  center: AvalancheCenterDangerMapWidgetConfiguration['center'],
): DangerMapViewport | null {
  const lat = center?.lat
  const lng = center?.lng
  if (typeof lat !== 'number' || !Number.isFinite(lat)) return null
  if (typeof lng !== 'number' || !Number.isFinite(lng)) return null
  return { lat, lng }
}

/**
 * Convert a configured zoom level to the equivalent Mapbox GL zoom.
 *
 * The zoom values forecasters set in the NAC dashboard were authored against the **Google Maps**
 * danger map — that is still the widget AvyWeb embeds today. Google serves 256px tiles and Mapbox
 * GL serves 512px ones, so the same zoom number renders twice the linear scale in Mapbox: a
 * configured 8 lands where Google would put 9, and the native map comes up a full level tighter
 * than the widget beside it. Subtracting one restores what the forecaster actually chose.
 */
export function mapboxZoomFor(configuredZoom: number): number {
  return configuredZoom - 1
}

export function resolveDangerMapSettings(
  config: AvalancheCenterDangerMapWidgetConfiguration | undefined,
): DangerMapSettings {
  if (!config) return DANGER_MAP_DEFAULTS

  return {
    height: clampHeight(config.height),
    search: Boolean(config.search),
    geolocate: Boolean(config.geolocate),
    advice: Boolean(config.advice),
    allCenters: Boolean(config.allCenters),
    center: resolveViewport(config.center),
    zoom: typeof config.zoom === 'number' ? config.zoom : DANGER_MAP_DEFAULTS.zoom,
  }
}
