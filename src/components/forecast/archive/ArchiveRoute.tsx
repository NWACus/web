/**
 * What the archive's routes share: the platform gate, the rollout flag, and the choice between the
 * native browser and the legacy widget's matching hash route. Each route keeps its own breadcrumbs
 * and metadata, so the page owns its title.
 */
import { createLoader, type SearchParams } from 'nuqs/server'

import { ForecastWidget } from '@/components/NACWidget/ForecastWidget'
import type { ArchiveView } from '@/services/nac/forecastArchive'
import { assertCenterPlatform } from '@/utilities/centerRoutePage'
import { getNativeProductFlag } from '@/utilities/getNativeProductFlag'

import { ForecastArchiveBrowser } from './ForecastArchiveBrowser'
import { archiveSearchParams } from './archiveSearchParams'

const loadArchiveSearchParams = createLoader(archiveSearchParams)

/** The legacy widget's hash route for each tab, so a link survives a center's flag flipping back. */
const WIDGET_PATHS: Record<ArchiveView, string> = {
  forecasts: '/archive/forecast',
  danger: '/archive/visual',
}

interface ArchiveRouteProps {
  center: string
  searchParams: Promise<SearchParams>
  view: ArchiveView
  /** The route's breadcrumb trail, rendered once the gates have passed. */
  breadcrumbs: React.ReactNode
}

export async function ArchiveRoute({ center, searchParams, view, breadcrumbs }: ArchiveRouteProps) {
  await assertCenterPlatform(center, 'forecasts')

  const useNative = await getNativeProductFlag(center, 'forecast')

  if (useNative) {
    const query = await loadArchiveSearchParams(searchParams)
    return (
      <>
        {breadcrumbs}
        <ForecastArchiveBrowser centerSlug={center} query={query} view={view} />
      </>
    )
  }

  return (
    <ForecastWidget center={center} initialPath={WIDGET_PATHS[view]} widgetPageKey="forecast-zone">
      {breadcrumbs}
    </ForecastWidget>
  )
}
