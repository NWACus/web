import type { Metadata, ResolvedMetadata } from 'next/types'

import { StationPageView } from '@/components/WeatherStations/StationPageView'
import { resolveStationRange } from '@/components/WeatherStations/StationRangeTabs'
import {
  getStationGroup,
  STATIONS_TENANT_SLUG,
  WEATHER_STATION_GROUPS,
} from '@/constants/weatherStations'
import { fetchStationTimeseries } from '@/services/snowobs/snowobs'
import { buildStationTable } from '@/services/snowobs/transform'
import { notFound } from 'next/navigation'

// ISR: regenerate at most every 10 minutes; SnowObs stations report ~hourly.
export const revalidate = 600

type Args = {
  params: Promise<{ center: string; station: string }>
  searchParams: Promise<{ range?: string }>
}

export async function generateStaticParams() {
  return WEATHER_STATION_GROUPS.map((group) => ({
    center: STATIONS_TENANT_SLUG,
    station: group.slug,
  }))
}

export default async function Page({ params, searchParams }: Args) {
  const { center, station } = await params
  const { range: rangeParam } = await searchParams

  if (center !== STATIONS_TENANT_SLUG) {
    notFound()
  }

  const group = getStationGroup(station)
  if (!group) {
    notFound()
  }

  const activeRange = resolveStationRange(rangeParam)
  const response = await fetchStationTimeseries(group.stids, {
    revalidate,
    windowHours: activeRange.hours,
  })
  const table = buildStationTable(response, group.columns)

  return <StationPageView group={group} table={table} activeRange={activeRange} />
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
  const group = getStationGroup(station)

  const parentTitle = resolveParentTitle(parentMeta)
  const routeTitle = group ? group.displayName : 'Weather Station'
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
