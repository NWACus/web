import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import type { Metadata, ResolvedMetadata } from 'next/types'

import { StationPageView } from '@/components/WeatherStations/StationPageView'
import type { StationViewSubject } from '@/components/WeatherStations/stationTabViews'
import { loadStationNotes, resolveTabView } from '@/components/WeatherStations/stationTabViews'
import { TrackedStationDetails } from '@/components/WeatherStations/TrackedStationDetails'
import { getAvalancheCenterPlatforms } from '@/services/nac/nac'
import { stationDetailPath } from '@/services/snowobs/stationKey'
import type { TrackedStation } from '@/services/snowobs/stationTracking'
import { findTrackedStation } from '@/services/snowobs/trackedStations'
import { getStationPages, toPageSummaries } from '@/services/stations/getStationPages'
import { centerTimezone, isValidTenantSlug } from '@/utilities/tenancy/avalancheCenters'
import { notFound } from 'next/navigation'

// Any one station the center's SnowObs token tracks, shown with a station page's views: the
// native stand-in for the legacy station widget's modal. There are thousands across centers, so
// none is prerendered (no generateStaticParams) and the query string renders each per request.

type PathArgs = { center: string; source: string; stid: string }

type Args = {
  params: Promise<PathArgs>
  searchParams: Promise<{ range?: string; period?: string }>
}

// Only a tracked station has a page, so this route never proxies SnowObs for an arbitrary stid.
async function loadTrackedStation({ center, source, stid }: PathArgs): Promise<TrackedStation> {
  if (!isValidTenantSlug(center)) notFound()
  const platforms = await getAvalancheCenterPlatforms(center)
  if (!platforms.stations) notFound()
  const station = await findTrackedStation(center, { source, stid })
  if (!station) notFound()
  return station
}

function displayName(station: TrackedStation): string {
  return station.name ?? station.stid
}

export default async function Page({ params, searchParams }: Args) {
  const pathArgs = await params
  const { center } = pathArgs
  const { range: rangeParam, period: periodParam } = await searchParams
  const station = await loadTrackedStation(pathArgs)
  const ref = { source: station.source, stid: station.stid }
  const path = stationDetailPath(ref)

  const pages = toPageSummaries(await getStationPages(center))
  const subject: StationViewSubject = { slug: null, archived: false, stations: [ref], columns: [] }
  const timeZone = centerTimezone(center)
  const csv = { action: `${path}/csv`, filePrefix: station.source }
  const [view, notes] = await Promise.all([
    resolveTabView({ center, subject, pages, timeZone, csv }, rangeParam, periodParam),
    loadStationNotes(center, subject.stations),
  ])

  return (
    <>
      {/* Crumbs from the map, which is where these pages are reached from; the URL's own
          segments (`station`, the source) have no pages to link to. */}
      <Breadcrumbs
        center={center}
        path={`/weather/stations/map/${encodeURIComponent(station.stid)}`}
        title={displayName(station)}
        hasStationsIndex={pages.length > 0}
      />
      <StationPageView
        page={{ slug: null, displayName: displayName(station), archived: false }}
        pages={pages}
        table={view.table}
        notes={notes}
        timeZone={timeZone}
        details={<TrackedStationDetails station={station} />}
        tabContent={view.tabContent}
      />
    </>
  )
}

function resolveParentTitle(parent: ResolvedMetadata): Metadata['title'] {
  const { title } = parent
  return title && typeof title !== 'string' && 'absolute' in title ? title.absolute : title
}

export async function generateMetadata(
  props: Args,
  parent: Promise<ResolvedMetadata>,
): Promise<Metadata> {
  const station = await loadTrackedStation(await props.params)
  const parentTitle = resolveParentTitle(await parent)
  const title = `${displayName(station)} | ${parentTitle}`

  return {
    title,
    alternates: { canonical: stationDetailPath(station) },
    // Thousands of stations shouldn't compete with the center's own station pages in search.
    robots: { index: false, follow: true },
  }
}
