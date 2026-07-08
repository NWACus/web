import type { Metadata, ResolvedMetadata } from 'next/types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { StationLatestObservation } from '@/components/WeatherStations/StationLatestObservation'
import { StationNowTable } from '@/components/WeatherStations/StationNowTable'
import { StationPicker } from '@/components/WeatherStations/StationPicker'
import {
  resolveStationRange,
  StationRangeTabs,
} from '@/components/WeatherStations/StationRangeTabs'
import { getStationGroup, WEATHER_STATION_GROUPS } from '@/constants/weatherStations'
import { getAvalancheCenterPlatforms } from '@/services/nac/nac'
import { fetchStationTimeseries } from '@/services/snowobs/snowobs'
import { buildStationTable } from '@/services/snowobs/transform'
import { notFound } from 'next/navigation'

// ISR: regenerate at most every 10 minutes; SnowObs stations report ~hourly.
export const revalidate = 600

type PathArgs = {
  center: string
  station: string
}

type Args = {
  params: Promise<PathArgs>
  searchParams: Promise<{ range?: string }>
}

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const tenants = await payload.find({
    collection: 'tenants',
    limit: 0,
    select: {
      slug: true,
    },
  })

  const params: PathArgs[] = []
  for (const tenant of tenants.docs) {
    const platforms = await getAvalancheCenterPlatforms(tenant.slug)
    if (!platforms.stations) continue
    for (const group of WEATHER_STATION_GROUPS) {
      params.push({ center: tenant.slug, station: group.slug })
    }
  }
  return params
}

// CRAP is inflated by the lack of unit coverage on this server component.
// fallow-ignore-next-line complexity
export default async function Page({ params, searchParams }: Args) {
  const { center, station } = await params
  const { range: rangeParam } = await searchParams

  const platforms = await getAvalancheCenterPlatforms(center)
  if (!platforms.stations) {
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

  return (
    <div className="mb-10 flex flex-col gap-4">
      <div className="container flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-sm text-muted-foreground">{group.region}</p>
          <div className="prose dark:prose-invert max-w-none">
            <h1 className="font-bold">{group.displayName}</h1>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StationLatestObservation table={table} />
          <StationPicker current={group.slug} />
        </div>
      </div>

      <div className="container flex flex-col gap-3">
        <StationRangeTabs activeKey={activeRange.key} />
        <StationNowTable table={table} />
      </div>
    </div>
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
