import type { Metadata, ResolvedMetadata } from 'next/types'

import { StationCsvForm } from '@/components/WeatherStations/StationCsvForm'
import { STATION_GRAPH_PRESETS } from '@/components/WeatherStations/stationGraphPresets'
import { StationGraphs } from '@/components/WeatherStations/StationGraphs'
import { StationPageView } from '@/components/WeatherStations/StationPageView'
import { resolveTablePeriod } from '@/components/WeatherStations/stationPeriods'
import { StationRangeTabs } from '@/components/WeatherStations/StationRangeTabs'
import { StationStickyBar } from '@/components/WeatherStations/StationStickyBar'
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
  searchParams: Promise<{ range?: string; period?: string }>
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
  table: StationTable | null
  tabContent?: ReactNode
}

async function csvTabView(group: WeatherStationGroup): Promise<TabView> {
  return {
    table: null,
    tabContent: (
      <>
        <StationStickyBar>
          <StationRangeTabs activeKey="csv" />
        </StationStickyBar>
        <StationCsvForm
          slug={group.slug}
          dataloggers={await loadDataloggers(group)}
          years={csvYears()}
        />
      </>
    ),
  }
}

function graphsTabView(group: WeatherStationGroup): TabView {
  return {
    table: null,
    tabContent: (
      <StationGraphs
        stids={group.stids}
        presets={STATION_GRAPH_PRESETS}
        currentSlug={group.slug}
        tabs={<StationRangeTabs activeKey="graphs" />}
      />
    ),
  }
}

async function tableTabView(group: WeatherStationGroup, periodParam?: string): Promise<TabView> {
  const period = resolveTablePeriod(periodParam)
  const response = await fetchStationTimeseries(group.stids, {
    revalidate,
    windowHours: period.hoursBack(new Date()),
    rawData: true,
  })
  const table = buildStationTable(response, group.columns)
  return {
    table,
    tabContent: (
      <StationTableView
        table={table}
        activePeriodKey={period.key}
        tabs={<StationRangeTabs activeKey="table" />}
      />
    ),
  }
}

// An archived station's table and graphs are empty, so downloads lead.
function defaultTabKey(group: WeatherStationGroup): string {
  return group.archived ? 'csv' : 'table'
}

const TAB_VIEWS: Record<string, (group: WeatherStationGroup) => TabView | Promise<TabView>> = {
  csv: csvTabView,
  graphs: graphsTabView,
}

async function resolveTabView(
  group: WeatherStationGroup,
  rangeParam?: string,
  periodParam?: string,
): Promise<TabView> {
  const build = TAB_VIEWS[rangeParam ?? defaultTabKey(group)]
  // Anything else is the table, including legacy `?range=24h` links.
  return build ? build(group) : tableTabView(group, periodParam ?? rangeParam)
}

export default async function Page({ params, searchParams }: Args) {
  const { center, station } = await params
  const { range: rangeParam, period: periodParam } = await searchParams

  if (center !== STATIONS_TENANT_SLUG) {
    notFound()
  }

  const group = getStationGroup(station)
  if (!group) {
    notFound()
  }

  const view = await resolveTabView(group, rangeParam, periodParam)

  return <StationPageView group={group} table={view.table} tabContent={view.tabContent} />
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
