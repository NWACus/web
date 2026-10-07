import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import type { Metadata, ResolvedMetadata } from 'next/types'

import { StationPageView } from '@/components/WeatherStations/StationPageView'
import { loadStationMeta, resolveTabView } from '@/components/WeatherStations/stationTabViews'
import { fetchLastReported } from '@/services/snowobs/lastReported'
import {
  allStationPageParams,
  getStationPages,
  toPageSummaries,
} from '@/services/stations/getStationPages'
import { centerTimezone } from '@/utilities/tenancy/avalancheCenters'
import { notFound } from 'next/navigation'

type Args = {
  params: Promise<{ center: string; station: string }>
  searchParams: Promise<{ range?: string; period?: string }>
}

export async function generateStaticParams() {
  return allStationPageParams()
}

export default async function Page({ params, searchParams }: Args) {
  const { center, station } = await params
  const { range: rangeParam, period: periodParam } = await searchParams

  const pages = await getStationPages(center)
  const page = pages.find((p) => p.slug === station)
  if (!page) {
    notFound()
  }

  const timeZone = centerTimezone(center)
  const csv = { action: `/weather/stations/${page.slug}/csv`, filePrefix: page.slug }
  const [view, { notes, stations }, lastReported] = await Promise.all([
    resolveTabView(
      { center, subject: page, pages: toPageSummaries(pages), timeZone, csv },
      rangeParam,
      periodParam,
    ),
    loadStationMeta(center, page.stations),
    page.archived ? fetchLastReported(center, page.stations) : null,
  ])

  return (
    <>
      <Breadcrumbs
        center={center}
        path={`/weather/stations/${station}`}
        title={page.displayName}
        hasStationsIndex
      />
      <StationPageView
        page={page}
        pages={toPageSummaries(pages)}
        notes={notes}
        stations={stations}
        lastReported={lastReported}
        timeZone={timeZone}
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
  const { center, station } = await props.params
  const parentMeta = await parent
  const pages = await getStationPages(center)
  const page = pages.find((p) => p.slug === station)

  const parentTitle = resolveParentTitle(parentMeta)
  const routeTitle = page ? page.displayName : 'Weather Station'
  const canonical = `/weather/stations/${station}`

  return {
    title: `${routeTitle} | ${parentTitle}`,
    alternates: { canonical },
    openGraph: {
      ...parentMeta.openGraph,
      title: `${routeTitle} | ${parentTitle}`,
      url: canonical,
      images: [
        {
          url: `/api/${center}/og?routeTitle=${encodeURIComponent(routeTitle)}`,
          width: 1200,
          height: 630,
        },
      ],
    },
  }
}
