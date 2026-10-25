/**
 * The danger map's per-center configuration, normalized.
 *
 * Forecasters configure their danger map in dashboard-v2 (Settings → Map), which writes to
 * `widget_config.danger_map` on the center's NAC metadata. The legacy widget reads only one field
 * of it, `allCenters`, and so does the native map:
 *
 * - **Search, geolocate and travel advice are always on.** The dashboard stores toggles for them,
 *   but the widget ignores them, so a center that turned one off still sees it in the widget.
 * - **The viewport always fits the center's zones.** The widget takes a fixed viewport only from
 *   its embed's data attributes, which AvyWeb's embed doesn't set, never from the dashboard.
 * - **`height` and `saturation` are inert.** AvyWeb pins the map's height (`DANGER_MAP_HEIGHT` in
 *   `HomeDangerMap.tsx`), and no Mapbox consumer in the NAC stack applies the dashboard's
 *   "Map color" control; the shared "AFP Custom" style is already near-grayscale.
 */
import type { AvalancheCenterDangerMapWidgetConfiguration } from '../types/schemas'

export interface DangerMapSettings {
  /** Draw every NAC center's zones, not just this center's. */
  allCenters: boolean
}

export function resolveDangerMapSettings(
  config: AvalancheCenterDangerMapWidgetConfiguration | undefined,
): DangerMapSettings {
  return { allCenters: Boolean(config?.allCenters) }
}

/**
 * Convert a configured zoom level to the equivalent Mapbox GL zoom.
 *
 * The zoom values forecasters set in the NAC dashboard were authored against Google Maps-based
 * widgets. Google serves 256px tiles and Mapbox GL serves 512px ones, so the same zoom number
 * renders twice the linear scale in Mapbox: a configured 8 lands where Google would put 9.
 * Subtracting one restores what the forecaster actually chose.
 */
export function mapboxZoomFor(configuredZoom: number): number {
  return configuredZoom - 1
}
