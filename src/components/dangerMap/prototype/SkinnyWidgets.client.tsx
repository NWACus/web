'use client'

/**
 * PROTOTYPE ONLY — the skinny layout built from today's legacy widgets, for centers still on them:
 * the map widget beside the forecast widget opened at its all-zones route. Live data only.
 *
 * Must not import anything Mapbox: `@mapbox/search-js-web` registers custom elements that the
 * legacy map widget's bundle also registers, and the widget script dies on the clash.
 */
import { ZoneLinkHijacker } from '@/app/(frontend)/[center]/forecasts/avalanche/ZoneLinkHijacker.client'
import { NACWidget } from '@/components/NACWidget'
import { WidgetRouterHandler } from '@/components/NACWidget/WidgetRouterHandler.client'

const MAP_HEIGHT = 700

export function SkinnyWidgetsVariant({ centerSlug }: { centerSlug: string }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      {/* The forecast widget comes first in the DOM because ZoneLinkHijacker watches the first
          #widget-container; `order` puts the map back on the left. The all-zones view is a
          full-page layout, so it scrolls inside a box the map's height. */}
      <div
        className="overflow-y-auto rounded border sm:order-2 sm:basis-1/2"
        style={{ maxHeight: MAP_HEIGHT }}
      >
        <WidgetRouterHandler initialPath="/all/" widgetPageKey="forecasts" />
        <ZoneLinkHijacker />
        <NACWidget center={centerSlug} widget="forecast" />
      </div>
      <div className="sm:order-1 sm:basis-1/2">
        <NACWidget center={centerSlug} widget="map" mapHeight={MAP_HEIGHT} />
      </div>
      <style>{`
        #widget-container[data-widget='forecast'] { min-height: 0 !important; }
        #nac-app #nac-danger-map-widget .nac-map-container { height: ${MAP_HEIGHT}px !important; }
      `}</style>
    </div>
  )
}
