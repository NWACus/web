/**
 * The home page's danger-map slot, and the place this product's control axes are resolved:
 *
 * - the per-tenant native rollout flag (Control 1) chooses the native map over the legacy `map`
 *   widget, so a tenant can be rolled back instantly;
 * - the center's own danger-map settings (height, controls, viewport, all-centers) come from the
 *   NAC dashboard, so a forecaster who configured their embed sees the same map here;
 * - the center's capability flags decide whether it renders in information-exchange mode.
 *
 * Unlike the warnings slot there is no upstream capability gate: the legacy widget renders for
 * every tenant regardless of platform, and gating only the native path would make the flag flip a
 * visible change for a center with no forecasts rather than a like-for-like swap. The capability
 * feed changes *how* the map renders, never whether it does.
 */
import { NACWidget } from '@/components/NACWidget'
import { DangerScale } from '@/components/forecast/DangerScale'
import { resolveDangerMapSettings } from '@/services/nac/dangerMap/dangerMapSettings'
import { isInformationExchange } from '@/services/nac/informationExchange'
import { getAvalancheCenterMetadata, getAvalancheCenterPlatforms } from '@/services/nac/nac'
import { getNativeProductFlag } from '@/utilities/getNativeProductFlag'

import { DangerMapLoader } from './DangerMapLoader.client'

/**
 * The height the map renders at, on both paths — deliberately *not* the configured
 * `danger_map.height`, which reaches no embed in the NAC stack (the widget reads only
 * `mapWidgetData.height`, else its own 500px). Honoring it natively would shrink the map on the
 * flag flip for most centers and make AvyWeb the one surface where the control does anything —
 * the same story as `saturation` in `dangerMapSettings`. nac-widgets.css pins the widget's map
 * container to the same value; keep the two in sync.
 */
const DANGER_MAP_HEIGHT = 500
/**
 * Height of the danger-scale graphic under the legacy widget's map, reserved to avoid layout
 * shift — zero on an exchange, where the widget draws no scale. It picks that mode by the `AIX`
 * suffix rather than by capability; the rules agree on every center that can be a tenant.
 */
const HEIGHT_OF_DANGER_SCALE_GRAPHIC = 73.59

/**
 * Server-rendered: holds its space from first paint, and keeps `sanitize-html` off the client.
 * An exchange's zones carry no rating for a scale to explain, so — as in the widget — it gets none.
 */
function MapLegend({ informationExchange }: { informationExchange: boolean }) {
  if (informationExchange) return null
  return <DangerScale />
}

interface HomeDangerMapProps {
  centerSlug: string
}

export async function HomeDangerMap({ centerSlug }: HomeDangerMapProps) {
  const [metadata, platforms, useNative] = await Promise.all([
    getAvalancheCenterMetadata(centerSlug),
    getAvalancheCenterPlatforms(centerSlug),
    getNativeProductFlag(centerSlug, 'dangerMap'),
  ])

  const settings = resolveDangerMapSettings(metadata?.widget_config?.danger_map)
  const informationExchange = isInformationExchange(platforms)

  if (!useNative) {
    return (
      <div
        className="w-full"
        style={{
          minHeight: DANGER_MAP_HEIGHT + (informationExchange ? 0 : HEIGHT_OF_DANGER_SCALE_GRAPHIC),
        }}
      >
        <NACWidget center={centerSlug} widget="map" mapHeight={DANGER_MAP_HEIGHT} />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* The map is client-only, so reserving its height on this server-rendered element is what
          keeps the page from jumping when it hydrates. */}
      <div style={{ height: DANGER_MAP_HEIGHT }}>
        <DangerMapLoader
          centerSlug={centerSlug}
          centerId={metadata.id}
          settings={settings}
          informationExchange={informationExchange}
        />
      </div>

      <MapLegend informationExchange={informationExchange} />
    </div>
  )
}
