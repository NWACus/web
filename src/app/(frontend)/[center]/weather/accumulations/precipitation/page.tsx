import type { Metadata, ResolvedMetadata } from 'next/types'

import { PageAutoRefresh } from '@/components/WeatherStations/PageAutoRefresh'
import { PrecipAccumulationTable } from '@/components/WeatherStations/PrecipAccumulationTable'
import { PRECIP_STATION_STIDS, STATIONS_TENANT_SLUG } from '@/constants/weatherStations'
import { fetchStationTimeseries } from '@/services/snowobs/snowobs'
import { buildPrecipAccumulationTable } from '@/services/snowobs/transform'
import { notFound } from 'next/navigation'

// ISR every 5 minutes, matching the legacy page's refresh cadence.
export const revalidate = 300

const ROUTE_TITLE = 'Accumulated Precipitation'
const CANONICAL = '/weather/accumulations/precipitation'

type Args = {
  params: Promise<{ center: string }>
}

export async function generateStaticParams() {
  return [{ center: STATIONS_TENANT_SLUG }]
}

export default async function Page({ params }: Args) {
  const { center } = await params

  if (center !== STATIONS_TENANT_SLUG) {
    notFound()
  }

  // One 72h fetch covers every trailing window (1H..72H are sums over it).
  const response = await fetchStationTimeseries(PRECIP_STATION_STIDS, {
    revalidate,
    windowHours: 72,
  })
  const table = buildPrecipAccumulationTable(response, PRECIP_STATION_STIDS)

  return (
    <div className="container my-8 space-y-4">
      <h1 className="text-3xl font-bold">{ROUTE_TITLE}</h1>
      <PageAutoRefresh seconds={revalidate} />
      <div className="overflow-x-auto">
        <PrecipAccumulationTable table={table} />
      </div>
      <div className="text-sm text-muted-foreground">
        <p>
          Data not quality controlled. Accumulated precipitation does not reflect weather station
          outages or other technical errors.
        </p>
        <p>This page refreshes every 5 minutes</p>
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
  const { center } = await props.params
  const parentMeta = await parent
  const parentTitle = resolveParentTitle(parentMeta)

  return {
    title: `${ROUTE_TITLE} | ${parentTitle}`,
    alternates: { canonical: CANONICAL },
    openGraph: {
      ...parentMeta.openGraph,
      title: `${ROUTE_TITLE} | ${parentTitle}`,
      url: CANONICAL,
      images: [
        {
          url: `/api/${center}/og?routeTitle=${encodeURIComponent(ROUTE_TITLE)}`,
          width: 1200,
          height: 630,
        },
      ],
    },
  }
}
