/**
 * The home page's danger-map slot, and the place this product's control axes are resolved:
 *
 * - the per-tenant native rollout flag (Control 1) chooses the native map over the legacy `map`
 *   widget, so a tenant can be rolled back instantly;
 * - the center's own danger-map settings (height, controls, viewport, all-centers) come from the
 *   NAC dashboard, so a forecaster who configured their embed sees the same map here;
 * - the center's capability flags decide whether this is an information exchange, whose map has
 *   no danger scale under it and whose zones describe observations rather than a rating.
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
 * The height the map renders at, on both paths.
 *
 * Deliberately *not* the AFP-configured `danger_map.height`. The Mapbox widget build reads its
 * height from `mapWidgetData.height` alone and otherwise falls back to its own 500px, so the
 * height a forecaster sets in the dashboard reaches no embed in the NAC stack — the same story as
 * `saturation` in `dangerMapSettings`. Honoring it on the native path only would make AvyWeb the
 * one surface where the control does anything, and would visibly shrink the map on the flag flip
 * for every center that configured less than 500 (most of them: 350–500 across the centers).
 *
 * Reserved as min-height under the widget so the page doesn't shift while it loads, and passed as
 * `mapWidgetData.height` for builds that read it. nac-widgets.css pins the widget's map container
 * to the same value for builds that don't. Keep the two in sync.
 */
const DANGER_MAP_HEIGHT = 500
/** Height of the danger-scale graphic under the legacy widget's map, reserved to avoid layout shift. */
const HEIGHT_OF_DANGER_SCALE_GRAPHIC = 73.59

/**
 * The space the legend takes under the *legacy widget's* map, so the page doesn't jump when the
 * widget mounts. The widget draws no danger scale in its AIX mode, which it enters by the center
 * id's suffix — its rule, not ours, because this reservation predicts what the widget will draw.
 * (`isInformationExchange` and the suffix agree on every exchange today; they differ on
 * observation-only centers without the suffix, where the widget still draws its scale.)
 */
function legacyLegendHeight(centerId: string): number {
  return centerId.endsWith('AIX') ? 0 : HEIGHT_OF_DANGER_SCALE_GRAPHIC
}

/**
 * The danger scale under the native map. Server-rendered, both so it holds its own space from the
 * first paint and so `sanitize-html` stays out of the client bundle. An exchange's zones carry no
 * rating for a scale to explain, so — as in the widget — it gets none.
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

  // `danger_map` is optional in the widget config — a center that never opened the dashboard's
  // map settings has none — and the resolver supplies the dashboard's defaults in its place.
  const settings = resolveDangerMapSettings(metadata?.widget_config?.danger_map)
  const informationExchange = isInformationExchange(platforms)

  if (!useNative) {
    return (
      <div
        className="w-full"
        style={{ minHeight: DANGER_MAP_HEIGHT + legacyLegendHeight(metadata.id) }}
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
