import type { Metadata, ResolvedMetadata } from 'next/types'
import type { SearchParams } from 'nuqs/server'

import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import { ArchiveRoute } from '@/components/forecast/archive/ArchiveRoute'
import { ARCHIVE_CRUMB, ARCHIVE_PATH } from '@/services/nac/forecastArchive'
import { centerRouteMetadata, type CenterRouteArgs } from '@/utilities/centerRoutePage'

/**
 * The filters are the query string, so this route renders per request. The cost is small: the
 * season's archive is one 30-minute `unstable_cache` entry shared by every reader, and the rest of
 * the page is pure functions over it.
 */
export const dynamic = 'force-dynamic'

type Args = CenterRouteArgs & {
  searchParams: Promise<SearchParams>
}

export default async function Page({ params, searchParams }: Args) {
  const { center } = await params

  return (
    <ArchiveRoute
      center={center}
      searchParams={searchParams}
      view="forecasts"
      breadcrumbs={<Breadcrumbs center={center} path={ARCHIVE_PATH} title={ARCHIVE_CRUMB} />}
    />
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
    path: ARCHIVE_PATH,
    center,
  })
}
