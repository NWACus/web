import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import type { Metadata, ResolvedMetadata } from 'next/types'

import type { Datalogger } from '@/components/WeatherStations/StationCsvForm'
import { StationCsvForm } from '@/components/WeatherStations/StationCsvForm'
import { STATION_GRAPH_PRESETS } from '@/components/WeatherStations/stationGraphPresets'
import { StationGraphs } from '@/components/WeatherStations/StationGraphs'
import { StationPageView } from '@/components/WeatherStations/StationPageView'
import { resolveTablePeriod } from '@/components/WeatherStations/stationPeriods'
import { StationRangeTabs } from '@/components/WeatherStations/StationRangeTabs'
import { StationTableView } from '@/components/WeatherStations/StationTableView'
import { StationViewBar } from '@/components/WeatherStations/StationViewBar'
import { resolveColumns } from '@/services/snowobs/deriveColumns'
import { fetchLastReported } from '@/services/snowobs/lastReported'
import { fetchStationTimeseries } from '@/services/snowobs/snowobs'
import { stationKey } from '@/services/snowobs/stationKey'
import type { StationNote, StationSummary } from '@/services/snowobs/tableHelpers'
import { buildStationTable, stationNotes, stationSummaries } from '@/services/snowobs/tableHelpers'
import type { AssembledStationPage, StationPageSummary } from '@/services/stations/getStationPages'
import {
  allStationPageParams,
  getStationPages,
  toPageSummaries,
} from '@/services/stations/getStationPages'
import { resolveStationTab } from '@/services/stations/stationTabs'
import { centerTimezone } from '@/utilities/tenancy/avalancheCenters'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'

// The page renders per request (it reads searchParams); only metadata is cached.
const METADATA_REVALIDATE = 600

type Args = {
  params: Promise<{ center: string; station: string }>
  searchParams: Promise<{ range?: string; period?: string }>
}

export async function generateStaticParams() {
  return allStationPageParams()
}

// Notes and the header's station list ride with the station metadata, so a
// 1-hour window is enough.
async function loadStationMeta(
  center: string,
  page: AssembledStationPage,
): Promise<{ notes: StationNote[]; stations: StationSummary[] }> {
  const meta = await fetchStationTimeseries(center, page.stations, {
    revalidate: METADATA_REVALIDATE,
    windowHours: 1,
  })
  return {
    notes: stationNotes(meta.STATION),
    stations: stationSummaries(page.stations, meta.STATION),
  }
}

// A 1-hour window: only the station metadata is needed.
async function loadDataloggers(center: string, page: AssembledStationPage): Promise<Datalogger[]> {
  const meta = await fetchStationTimeseries(center, page.stations, {
    revalidate: METADATA_REVALIDATE,
    windowHours: 1,
  })
  const byKey = new Map(meta.STATION.map((s) => [stationKey(s), s]))
  return page.stations.map((station) => {
    const found = byKey.get(stationKey(station))
    if (!found?.name) return { station, label: station.stid }
    return {
      station,
      label: found.elevation != null ? `${found.name}, ${found.elevation}'` : found.name,
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
  tabContent?: ReactNode
}

type TabContext = {
  center: string
  page: AssembledStationPage
  pages: StationPageSummary[]
  timeZone: string
  periodParam?: string
}

async function csvTabView({ center, page }: TabContext): Promise<TabView> {
  return {
    tabContent: (
      <>
        <StationViewBar>
          <StationRangeTabs activeKey="csv" tabs={page.tabs} />
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

function graphsTabView({ page, pages, timeZone }: TabContext): TabView {
  return {
    tabContent: (
      <StationGraphs
        stations={page.stations}
        presets={STATION_GRAPH_PRESETS}
        currentSlug={page.slug}
        pages={pages}
        timeZone={timeZone}
        tabs={<StationRangeTabs activeKey="graphs" tabs={page.tabs} />}
      />
    ),
  }
}

async function tableTabView({ center, page, timeZone, periodParam }: TabContext): Promise<TabView> {
  const period = resolveTablePeriod(periodParam)
  const response = await fetchStationTimeseries(center, page.stations, {
    windowHours: period.hoursBack(new Date(), timeZone),
    rawData: true,
  })
  const table = buildStationTable(center, response, resolveColumns(response, page))
  return {
    tabContent: (
      <StationTableView
        table={table}
        activePeriodKey={period.key}
        tabs={<StationRangeTabs activeKey="table" tabs={page.tabs} />}
      />
    ),
  }
}

async function resolveTabView(
  context: TabContext,
  rangeParam?: string,
  periodParam?: string,
): Promise<TabView> {
  const { tab, period } = resolveStationTab(context.page.tabs, context.page.archived, rangeParam)
  if (tab === 'csv') return csvTabView(context)
  if (tab === 'graphs') return graphsTabView(context)
  return tableTabView({ ...context, periodParam: periodParam ?? period })
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
  const [view, { notes, stations }, lastReported] = await Promise.all([
    resolveTabView(
      { center, page, pages: toPageSummaries(pages), timeZone },
      rangeParam,
      periodParam,
    ),
    loadStationMeta(center, page),
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
