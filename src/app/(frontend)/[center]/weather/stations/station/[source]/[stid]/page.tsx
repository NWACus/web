import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import type { Metadata, ResolvedMetadata } from 'next/types'

import { StationAreaLinks } from '@/components/WeatherStations/StationAreaLinks'
import { StationPageView } from '@/components/WeatherStations/StationPageView'
import type { StationViewSubject } from '@/components/WeatherStations/stationTabViews'
import { loadStationNotes, resolveTabView } from '@/components/WeatherStations/stationTabViews'
import { TrackedStationDetails } from '@/components/WeatherStations/TrackedStationDetails'
import { stationDetailPath } from '@/services/snowobs/stationKey'
import type { TrackedStation } from '@/services/snowobs/stationTracking'
import { findServedStation } from '@/services/snowobs/trackedStations'
import {
  areaPageFor,
  getStationPages,
  stationPagePath,
  toPageSummaries,
} from '@/services/stations/getStationPages'
import { centerTimezone } from '@/utilities/tenancy/avalancheCenters'
import { notFound } from 'next/navigation'

// The legacy station modal as a page, for any station the center tracks. Thousands across
// centers, so none is prerendered; the query string renders each per request.

type PathArgs = { center: string; source: string; stid: string }

type Args = {
  params: Promise<PathArgs>
  searchParams: Promise<{ range?: string; period?: string }>
}

async function loadTrackedStation({ center, source, stid }: PathArgs): Promise<TrackedStation> {
  const station = await findServedStation(center, { source, stid })
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
  const area = areaPageFor(pages, ref)
  const subject: StationViewSubject = { slug: null, archived: false, stations: [ref], columns: [] }
  const timeZone = centerTimezone(center)
  const csv = { action: `${path}/csv`, filePrefix: station.source }
  const [view, notes] = await Promise.all([
    resolveTabView({ center, subject, pages, timeZone, csv }, rangeParam, periodParam),
    loadStationNotes(center, subject.stations),
  ])

  return (
    <>
      {/* Trailed from the map: the URL's own `station` and source segments have no pages. */}
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
        details={
          <>
            <TrackedStationDetails station={station} />
            {area && <StationAreaLinks href={stationPagePath(area.slug)} className="mt-3" />}
          </>
        }
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
  const { center, ...ref } = await props.params
  const station = await loadTrackedStation({ center, ...ref })
  const parentMeta = await parent
  const title = `${displayName(station)} | ${resolveParentTitle(parentMeta)}`
  const canonical = stationDetailPath(station)
  const routeTitle = encodeURIComponent(displayName(station))

  return {
    title,
    alternates: { canonical },
    openGraph: {
      ...parentMeta.openGraph,
      title,
      url: canonical,
      images: [{ url: `/api/${center}/og?routeTitle=${routeTitle}`, width: 1200, height: 630 }],
    },
    // Thousands of stations shouldn't compete with the center's own station pages in search.
    robots: { index: false, follow: true },
  }
}
