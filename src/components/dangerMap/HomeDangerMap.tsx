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
 * The legacy widget's own CSS renders the map at 500px and ignores the AFP-configured height, so
 * the fallback pins it here: reserved as min-height so the page doesn't shift while the widget
 * loads, and passed as `mapWidgetData.height` for builds that read it. nac-widgets.css forces the
 * map container to the same value for builds that don't. Keep the two in sync.
 */
const DANGER_MAP_HEIGHT = 500
/** Height of the danger-scale graphic under the legacy widget's map, reserved to avoid layout shift. */
const HEIGHT_OF_DANGER_SCALE_GRAPHIC = 73.59

/**
 * The space the legend takes under the legacy widget's map. The widget draws no danger scale for
 * an information exchange (its AIX mode), so reserving one there would leave a permanent gap.
 */
function legendHeightFor(informationExchange: boolean): number {
  return informationExchange ? 0 : HEIGHT_OF_DANGER_SCALE_GRAPHIC
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

  // The exchanges' metadata carries `widget_config.danger_map` today, but `config` is null and
  // nothing here may assume the rest of the object is complete — hence the optional chain, with
  // the resolver supplying the dashboard's defaults for whatever is missing.
  const settings = resolveDangerMapSettings(metadata?.widget_config?.danger_map)
  const informationExchange = isInformationExchange(platforms)

  if (!useNative) {
    return (
      <div
        className="w-full"
        style={{ minHeight: DANGER_MAP_HEIGHT + legendHeightFor(informationExchange) }}
      >
        <NACWidget center={centerSlug} widget="map" mapHeight={DANGER_MAP_HEIGHT} />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/*
        The map is client-only (Mapbox needs a browser), so it contributes nothing to the server
        render. Reserving its configured height here — on a server-rendered element — is what keeps
        the page from jumping when it hydrates, the same thing the legacy widget's fixed height did.
      */}
      <div style={{ height: settings.height }}>
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
