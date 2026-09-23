import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import { ArchiveRoute } from '@/components/forecast/archive/ArchiveRoute'
import {
  ARCHIVE_TAB_BREADCRUMB_LABELS,
  archiveTabMetadata,
  type ArchiveTabArgs,
} from '@/components/forecast/archive/archiveTabRoute'
import { ARCHIVE_WEATHER_PATH } from '@/services/nac/forecastArchive'

/** Per request for the same reason as the forecast list: the filters are the query string. */
export const dynamic = 'force-dynamic'

const TITLE = 'Mountain Weather'

export default async function Page({ params, searchParams }: ArchiveTabArgs) {
  const { center } = await params
  const crumbs = { path: ARCHIVE_WEATHER_PATH, title: TITLE, labels: ARCHIVE_TAB_BREADCRUMB_LABELS }

  return (
    <ArchiveRoute
      center={center}
      searchParams={searchParams}
      view="weather"
      breadcrumbs={<Breadcrumbs center={center} {...crumbs} />}
    />
  )
}

export const generateMetadata = archiveTabMetadata(TITLE, ARCHIVE_WEATHER_PATH)
