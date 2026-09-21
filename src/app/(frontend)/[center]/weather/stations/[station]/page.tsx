import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import type { Metadata, ResolvedMetadata } from 'next/types'

import { StationCsvForm } from '@/components/WeatherStations/StationCsvForm'
import { STATION_GRAPH_PRESETS } from '@/components/WeatherStations/stationGraphPresets'
import { StationGraphs } from '@/components/WeatherStations/StationGraphs'
import { StationPageView } from '@/components/WeatherStations/StationPageView'
import { resolveTablePeriod } from '@/components/WeatherStations/stationPeriods'
import { StationRangeTabs } from '@/components/WeatherStations/StationRangeTabs'
import { StationTableView } from '@/components/WeatherStations/StationTableView'
import { StationViewBar } from '@/components/WeatherStations/StationViewBar'
import { resolveColumns } from '@/services/snowobs/deriveColumns'
import { fetchStationTimeseries } from '@/services/snowobs/snowobs'
import type { StationTable } from '@/services/snowobs/tableHelpers'
import { buildStationTable, stationNotes } from '@/services/snowobs/tableHelpers'
import type { AssembledStationPage, StationPageSummary } from '@/services/stations/getStationPages'
import {
  allStationPageParams,
  getStationPages,
  toPageSummaries,
} from '@/services/stations/getStationPages'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'

// ISR: regenerate at most every 10 minutes; SnowObs stations report ~hourly.
export const revalidate = 600

type Args = {
  params: Promise<{ center: string; station: string }>
  searchParams: Promise<{ range?: string; period?: string }>
}

export async function generateStaticParams() {
  return allStationPageParams()
}

// Notes ride with the station metadata, so a 1-hour window is enough.
async function loadStationNotes(center: string, page: AssembledStationPage) {
  const meta = await fetchStationTimeseries(center, page.stations, { revalidate, windowHours: 1 })
  return stationNotes(meta.STATION)
}

// Datalogger dropdown options for the CSV form: the page's station ids labeled with
// each logger's name + elevation (from a cheap 1-hour metadata fetch).
async function loadDataloggers(
  center: string,
  page: AssembledStationPage,
): Promise<{ stid: string; label: string }[]> {
  const meta = await fetchStationTimeseries(center, page.stations, { windowHours: 1 })
  return page.stids.map((stid) => {
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

type TabContext = {
  center: string
  page: AssembledStationPage
  pages: StationPageSummary[]
  periodParam?: string
}

async function csvTabView({ center, page }: TabContext): Promise<TabView> {
  return {
    table: null,
    tabContent: (
      <>
        <StationViewBar>
          <StationRangeTabs activeKey="csv" />
        </StationViewBar>
        <StationCsvForm
          slug={page.slug}
          dataloggers={await loadDataloggers(center, page)}
          years={csvYears()}
        />
      </>
    ),
  }
}

function graphsTabView({ page, pages }: TabContext): TabView {
  return {
    table: null,
    tabContent: (
      <StationGraphs
        stids={page.stids}
        presets={STATION_GRAPH_PRESETS}
        currentSlug={page.slug}
        pages={pages}
        tabs={<StationRangeTabs activeKey="graphs" />}
      />
    ),
  }
}

async function tableTabView({ center, page, periodParam }: TabContext): Promise<TabView> {
  const period = resolveTablePeriod(periodParam)
  const response = await fetchStationTimeseries(center, page.stations, {
    revalidate,
    windowHours: period.hoursBack(new Date()),
    rawData: true,
  })
  // Columns follow what the loggers report unless the page chose its own.
  const table = buildStationTable(response, resolveColumns(response, page))
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
function defaultTabKey(page: AssembledStationPage): string {
  return page.archived ? 'csv' : 'table'
}

const TAB_VIEWS: Record<string, (context: TabContext) => TabView | Promise<TabView>> = {
  csv: csvTabView,
  graphs: graphsTabView,
}

async function resolveTabView(
  context: TabContext,
  rangeParam?: string,
  periodParam?: string,
): Promise<TabView> {
  const build = TAB_VIEWS[rangeParam ?? defaultTabKey(context.page)]
  // Anything else is the table, including legacy `?range=24h` links.
  return build
    ? build(context)
    : tableTabView({ ...context, periodParam: periodParam ?? rangeParam })
}

export default async function Page({ params, searchParams }: Args) {
  const { center, station } = await params
  const { range: rangeParam, period: periodParam } = await searchParams

  const pages = await getStationPages(center)
  const page = pages.find((p) => p.slug === station)
  if (!page) {
    notFound()
  }

  const [view, notes] = await Promise.all([
    resolveTabView({ center, page, pages: toPageSummaries(pages) }, rangeParam, periodParam),
    loadStationNotes(center, page),
  ])

  return (
    <>
      <Breadcrumbs center={center} path={`/weather/stations/${station}`} title={page.displayName} />
      <StationPageView
        page={page}
        pages={toPageSummaries(pages)}
        table={view.table}
        notes={notes}
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
