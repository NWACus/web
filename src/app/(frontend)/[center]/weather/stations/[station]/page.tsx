import type { Metadata, ResolvedMetadata } from 'next/types'

import { StationCsvForm } from '@/components/WeatherStations/StationCsvForm'
import { STATION_GRAPH_PRESETS } from '@/components/WeatherStations/stationGraphPresets'
import { StationGraphs } from '@/components/WeatherStations/StationGraphs'
import { StationPageView } from '@/components/WeatherStations/StationPageView'
import { resolveTableWindow } from '@/components/WeatherStations/StationRangeTabs'
import { StationTableView } from '@/components/WeatherStations/StationTableView'
import {
  getStationGroup,
  NWAC_WEATHER_STATION_GROUPS,
  STATIONS_TENANT_SLUG,
  type WeatherStationGroup,
} from '@/constants/weatherStations'
import { fetchStationTimeseries } from '@/services/snowobs/snowobs'
import type { StationTable } from '@/services/snowobs/tableHelpers'
import { buildStationTable } from '@/services/snowobs/tableHelpers'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'

// ISR: regenerate at most every 10 minutes; SnowObs stations report ~hourly.
export const revalidate = 600

type Args = {
  params: Promise<{ center: string; station: string }>
  searchParams: Promise<{ range?: string; window?: string }>
}

export async function generateStaticParams() {
  return NWAC_WEATHER_STATION_GROUPS.map((group) => ({
    center: STATIONS_TENANT_SLUG,
    station: group.slug,
  }))
}

// Datalogger dropdown options for the CSV form: the group's station ids labeled with
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

type TabView = {
  key: string
  table: StationTable | null
  tabContent?: ReactNode
}

async function csvTabView(group: WeatherStationGroup): Promise<TabView> {
  return {
    key: 'csv',
    table: null,
    tabContent: (
      <StationCsvForm
        slug={group.slug}
        dataloggers={await loadDataloggers(group)}
        years={csvYears()}
      />
    ),
  }
}

function graphsTabView(group: WeatherStationGroup): TabView {
  return {
    key: 'graphs',
    table: null,
    tabContent: (
      <StationGraphs stids={group.stids} presets={STATION_GRAPH_PRESETS} currentSlug={group.slug} />
    ),
  }
}

async function tableTabView(group: WeatherStationGroup, windowParam?: string): Promise<TabView> {
  const window = resolveTableWindow(windowParam)
  const response = await fetchStationTimeseries(group.stids, {
    revalidate,
    windowHours: window.hoursBack(new Date()),
    rawData: true,
  })
  const table = buildStationTable(response, group.columns)
  return {
    key: 'table',
    table,
    tabContent: <StationTableView table={table} activeWindowKey={window.key} />,
  }
}

async function resolveTabView(
  group: WeatherStationGroup,
  rangeParam?: string,
  windowParam?: string,
): Promise<TabView> {
  if (rangeParam === 'csv') return csvTabView(group)
  if (rangeParam === 'graphs') return graphsTabView(group)
  return tableTabView(group, windowParam ?? rangeParam)
}

export default async function Page({ params, searchParams }: Args) {
  const { center, station } = await params
  const { range: rangeParam, window: windowParam } = await searchParams

  if (center !== STATIONS_TENANT_SLUG) {
    notFound()
  }

  const group = getStationGroup(station)
  if (!group) {
    notFound()
  }

  const view = await resolveTabView(group, rangeParam, windowParam)

  return (
    <StationPageView
      group={group}
      table={view.table}
      activeKey={view.key}
      tabContent={view.tabContent}
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
