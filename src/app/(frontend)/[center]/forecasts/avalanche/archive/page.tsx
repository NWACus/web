import type { Metadata, ResolvedMetadata } from 'next/types'
import { createLoader, type SearchParams } from 'nuqs/server'

import { ForecastWidget } from '@/components/NACWidget/ForecastWidget'
import { ForecastArchiveBrowser } from '@/components/forecast/archive/ForecastArchiveBrowser'
import { archiveSearchParams } from '@/components/forecast/archive/archiveSearchParams'
import {
  assertCenterPlatform,
  centerRouteMetadata,
  type CenterRouteArgs,
} from '@/utilities/centerRoutePage'
import { getNativeProductFlag } from '@/utilities/getNativeProductFlag'

/**
 * The filters are the query string, so this route renders per request. The cost is small: the
 * season's archive is one 30-minute `unstable_cache` entry shared by every reader, and the rest of
 * the page is pure functions over it.
 */
export const dynamic = 'force-dynamic'

const loadArchiveSearchParams = createLoader(archiveSearchParams)

type Args = CenterRouteArgs & {
  searchParams: Promise<SearchParams>
}

export default async function Page({ params, searchParams }: Args) {
  const { center } = await params

  await assertCenterPlatform(center, 'forecasts')

  const useNative = await getNativeProductFlag(center, 'forecast')

  if (useNative) {
    const query = await loadArchiveSearchParams(searchParams)
    return <ForecastArchiveBrowser centerSlug={center} query={query} />
  }

  // Widget fallback, so a link to this address keeps working when a center's flag is flipped back:
  // the legacy widget's archive is a hash route inside its forecast app.
  return (
    <ForecastWidget center={center} initialPath="/archive/forecast" widgetPageKey="forecast-zone" />
  )
}

export async function generateMetadata(
  props: CenterRouteArgs,
  parent: Promise<ResolvedMetadata>,
): Promise<Metadata> {
  const { center } = await props.params

  return centerRouteMetadata({
    parent,
    label: 'Forecast Archive',
    path: '/forecasts/avalanche/archive',
    center,
  })
}
