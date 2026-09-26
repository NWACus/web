/**
 * The home page's danger-map slot, and the place this product's control axes are resolved:
 *
 * - the per-tenant native rollout flag (Control 1) chooses the native map over the legacy `map`
 *   widget, so a tenant can be rolled back instantly;
 * - the center's own danger-map settings (controls, viewport, all-centers) come from the NAC
 *   dashboard, so a forecaster who configured their embed sees the same map here. Height is the
 *   exception: both maps render at DANGER_MAP_HEIGHT, so the flag flip doesn't change the layout.
 *
 * Unlike the warnings slot there is no upstream capability gate: the legacy widget renders for
 * every tenant regardless of platform, and gating only the native path would make the flag flip a
 * visible change for a center with no forecasts rather than a like-for-like swap.
 */
import { NACWidget } from '@/components/NACWidget'
import { DangerScale } from '@/components/forecast/DangerScale'
import { resolveDangerMapSettings } from '@/services/nac/dangerMap/dangerMapSettings'
import { getAvalancheCenterMetadata } from '@/services/nac/nac'
import { getNativeProductFlag } from '@/utilities/getNativeProductFlag'

import { DangerMapLoader } from './DangerMapLoader.client'

/**
 * Both maps render at this height, ignoring the AFP-configured one. The native map's wrapper is
 * sized to it; the legacy fallback reserves it as min-height and passes it as
 * `mapWidgetData.height`, and nac-widgets.css forces the widget's map container to the same value
 * for builds that don't read that. Keep the two in sync.
 */
const DANGER_MAP_HEIGHT = 500
/** Height of the danger-scale graphic under the legacy widget's map, reserved to avoid layout shift. */
const HEIGHT_OF_DANGER_SCALE_GRAPHIC = 73.59

interface HomeDangerMapProps {
  centerSlug: string
}

export async function HomeDangerMap({ centerSlug }: HomeDangerMapProps) {
  const [metadata, useNative] = await Promise.all([
    getAvalancheCenterMetadata(centerSlug),
    getNativeProductFlag(centerSlug, 'dangerMap'),
  ])

  const settings = resolveDangerMapSettings(metadata?.widget_config?.danger_map)

  if (!useNative) {
    return (
      <div
        className="w-full"
        style={{ minHeight: DANGER_MAP_HEIGHT + HEIGHT_OF_DANGER_SCALE_GRAPHIC }}
      >
        <NACWidget center={centerSlug} widget="map" mapHeight={DANGER_MAP_HEIGHT} />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/*
        The map is client-only (Mapbox needs a browser), so it contributes nothing to the server
        render. Reserving its height here — on a server-rendered element — is what keeps the page
        from jumping when it hydrates, the same thing the legacy widget's fixed height did.
      */}
      <div style={{ height: DANGER_MAP_HEIGHT }}>
        <DangerMapLoader centerSlug={centerSlug} centerId={metadata.id} settings={settings} />
      </div>

      {/* Server-rendered, both so it holds its own space from the first paint and so
          `sanitize-html` stays out of the client bundle. */}
      <DangerScale />
    </div>
  )
}
