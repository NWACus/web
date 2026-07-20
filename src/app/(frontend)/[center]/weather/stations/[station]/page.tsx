import type { Metadata, ResolvedMetadata } from 'next/types'

import { StationCsvForm } from '@/components/WeatherStations/StationCsvForm'
import { StationPageView } from '@/components/WeatherStations/StationPageView'
import { resolveStationRange } from '@/components/WeatherStations/StationRangeTabs'
import {
  getStationGroup,
  STATIONS_TENANT_SLUG,
  WEATHER_STATION_GROUPS,
  type WeatherStationGroup,
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

// Datalogger dropdown options for the CSV form: the group's stids labeled with
// each logger's name + elevation (from a cheap 1-hour metadata fetch).
async function loadDataloggers(
  group: WeatherStationGroup,
): Promise<{ stid: string; label: string }[]> {
  const meta = await fetchStationTimeseries(group.stids, { windowHours: 1 })
  return group.stids.map((stid) => {
    const station = meta.STATION.find((s) => s.stid === stid)
    if (!station?.name) return { stid, label: stid }
    return {
      stid,
      label: station.elevation != null ? `${station.name}, ${station.elevation}'` : station.name,
    }
  })
}

function csvYears(): number[] {
  const current = new Date().getUTCFullYear()
  const years: number[] = []
  for (let year = current; year >= 2016; year--) years.push(year)
  return years
}

// CRAP is inflated by the lack of unit coverage on this server component.
// fallow-ignore-next-line complexity
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

  const isCsv = rangeParam === 'csv'
  const activeRange = resolveStationRange(rangeParam)

  let table = null
  if (!isCsv) {
    const response = await fetchStationTimeseries(group.stids, {
      revalidate,
      windowHours: activeRange.hours,
    })
    table = buildStationTable(response, group.columns)
  }
  const dataloggers = isCsv ? await loadDataloggers(group) : []

  return (
    <StationPageView
      group={group}
      table={table}
      activeKey={isCsv ? 'csv' : activeRange.key}
      csvForm={
        isCsv ? (
          <StationCsvForm slug={group.slug} dataloggers={dataloggers} years={csvYears()} />
        ) : undefined
      }
    />
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
