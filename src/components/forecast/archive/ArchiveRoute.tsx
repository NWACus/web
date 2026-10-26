/**
 * What the archive's routes share: the platform gate, the rollout flag, and the choice between the
 * native browser and the legacy widget's matching hash route. Each route keeps its own breadcrumbs
 * and metadata, so the page owns its title.
 */
import { notFound } from 'next/navigation'
import { createLoader, type SearchParams } from 'nuqs/server'

import { ForecastWidget } from '@/components/NACWidget/ForecastWidget'
import type { ArchiveView } from '@/services/nac/forecastArchive'
import { assertCenterPlatform } from '@/utilities/centerRoutePage'

import { ForecastArchiveBrowser } from './ForecastArchiveBrowser'
import { archiveSearchParams } from './archiveSearchParams'
import { getWeatherArchiveAccess } from './weatherArchiveAccess'

const loadArchiveSearchParams = createLoader(archiveSearchParams)

/** The legacy widget's hash route for each tab, so a link survives a center's flag flipping back. */
const WIDGET_PATHS: Record<ArchiveView, string> = {
  forecasts: '/archive/forecast',
  danger: '/archive/visual',
  weather: '/archive/weather',
}

interface ArchiveRouteProps {
  center: string
  searchParams: Promise<SearchParams>
  view: ArchiveView
  /** The route's breadcrumb trail, rendered once the gates have passed. */
  breadcrumbs: React.ReactNode
}

export async function ArchiveRoute({ center, searchParams, view, breadcrumbs }: ArchiveRouteProps) {
  const { useNative, showWeather } = await archiveGates(center, view)

  if (useNative) {
    const query = await loadArchiveSearchParams(searchParams)
    return (
      <>
        {breadcrumbs}
        <ForecastArchiveBrowser
          centerSlug={center}
          query={query}
          view={view}
          showWeather={showWeather}
        />
      </>
    )
  }

  return (
    <ForecastWidget center={center} initialPath={WIDGET_PATHS[view]} widgetPageKey="forecast-zone">
      {breadcrumbs}
    </ForecastWidget>
  )
}

/**
 * Whether the tab renders natively, and whether the weather tab is offered. 404s a center without
 * forecasts, and the weather tab of a center without a NAC weather product.
 */
async function archiveGates(center: string, view: ArchiveView) {
  const [, weather] = await Promise.all([
    assertCenterPlatform(center, 'forecasts'),
    getWeatherArchiveAccess(center),
  ])

  // The tab is offered wherever it exists; its own route falls back to the widget when not native.
  if (view !== 'weather')
    return { useNative: weather.useNativeForecast, showWeather: weather.available }
  if (!weather.available) notFound()
  return { useNative: weather.native, showWeather: true }
}
