import type { Metadata, ResolvedMetadata } from 'next/types'

import { PrecipAccumulationTable } from '@/components/WeatherStations/PrecipAccumulationTable'
import { StationPicker } from '@/components/WeatherStations/StationPicker'
import { PRECIP_STATION_STIDS, STATIONS_TENANT_SLUG } from '@/constants/weatherStations'
import { fetchStationTimeseries } from '@/services/snowobs/snowobs'
import { buildPrecipAccumulationTable } from '@/services/snowobs/tableHelpers'
import { notFound } from 'next/navigation'

// Rendered per request: prerendering would call SnowObs at build time and pin the
// page to whatever that build saw (the [center] layout's generateStaticParams
// otherwise forces static generation). The fetch Data Cache still dedups
// upstream calls to one per window, matching the legacy 5-minute cadence.
export const dynamic = 'force-dynamic'
const REVALIDATE_SECONDS = 300

const ROUTE_TITLE = 'Accumulated Precipitation'
const CANONICAL = '/weather/stations/accumulated-precipitation'

type Args = {
  params: Promise<{ center: string }>
}

export default async function Page({ params }: Args) {
  const { center } = await params

  if (center !== STATIONS_TENANT_SLUG) {
    notFound()
  }

  // One 72h fetch covers every trailing window (1H..72H are sums over it).
  const response = await fetchStationTimeseries(PRECIP_STATION_STIDS, {
    revalidate: REVALIDATE_SECONDS,
    windowHours: 72,
  })
  const table = buildPrecipAccumulationTable(response, PRECIP_STATION_STIDS)

  return (
    <div className="mb-10 flex flex-col gap-4">
      <div className="container flex flex-wrap items-start justify-between gap-3 pb-4">
        <div className="prose dark:prose-invert max-w-none">
          <h1 className="font-bold">{ROUTE_TITLE}</h1>
        </div>
        <div className="flex flex-col items-end">
          <StationPicker />
        </div>
      </div>
      <div className="container flex flex-col gap-3">
        <PrecipAccumulationTable table={table} />
        <p className="text-sm text-muted-foreground">
          Data not quality controlled. Accumulated precipitation does not reflect weather station
          outages or other technical errors.
        </p>
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
