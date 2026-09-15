import type { Metadata, ResolvedMetadata } from 'next/types'
import type { SearchParams } from 'nuqs/server'

import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import { ArchiveRoute } from '@/components/forecast/archive/ArchiveRoute'
import { ARCHIVE_DANGER_PATH, ARCHIVE_PATH } from '@/services/nac/forecastArchive'
import { centerRouteMetadata, type CenterRouteArgs } from '@/utilities/centerRoutePage'

/** Per request for the same reason as the forecast list: the filters are the query string. */
export const dynamic = 'force-dynamic'

const TITLE = 'Danger Over Time'

const BREADCRUMB_LABELS = { [ARCHIVE_PATH]: 'Forecast Archive' }

type Args = CenterRouteArgs & {
  searchParams: Promise<SearchParams>
}

export default async function Page({ params, searchParams }: Args) {
  const { center } = await params

  return (
    <ArchiveRoute
      center={center}
      searchParams={searchParams}
      view="danger"
      breadcrumbs={
        <Breadcrumbs
          center={center}
          path={ARCHIVE_DANGER_PATH}
          title={TITLE}
          labels={BREADCRUMB_LABELS}
        />
      }
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
    label: `Forecast Archive: ${TITLE}`,
    path: ARCHIVE_DANGER_PATH,
    center,
  })
}
