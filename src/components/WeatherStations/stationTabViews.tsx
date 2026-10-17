import type { Datalogger } from '@/components/WeatherStations/StationCsvForm'
import { StationCsvForm } from '@/components/WeatherStations/StationCsvForm'
import { STATION_GRAPH_PRESETS } from '@/components/WeatherStations/stationGraphPresets'
import { StationGraphs } from '@/components/WeatherStations/StationGraphs'
import type { DateRange } from '@/components/WeatherStations/stationPeriods'
import {
  customRangeBounds,
  parseCustomRange,
  resolveTablePeriod,
  TABLE_MAX_CUSTOM_DAYS,
} from '@/components/WeatherStations/stationPeriods'
import { StationRangeTabs } from '@/components/WeatherStations/StationRangeTabs'
import { StationTableView } from '@/components/WeatherStations/StationTableView'
import { StationViewBar } from '@/components/WeatherStations/StationViewBar'
import { resolveColumns } from '@/services/snowobs/deriveColumns'
import { fetchStationTimeseries } from '@/services/snowobs/snowobs'
import type { StationRef } from '@/services/snowobs/stationKey'
import { stationKey } from '@/services/snowobs/stationKey'
import type { StationNote, StationSummary } from '@/services/snowobs/tableHelpers'
import { buildStationTable, stationNotes, stationSummaries } from '@/services/snowobs/tableHelpers'
import type { StationPageSummary } from '@/services/stations/getStationPages'
import type { StationColumn } from '@/services/stations/stationColumns'
import type { StationTabKey } from '@/services/stations/stationTabs'
import { resolveStationTab } from '@/services/stations/stationTabs'
import type { ReactNode } from 'react'

// The Table, Graphs and Download views, shared by a station page and a single
// tracked station's detail page.

// Station pages render per request (they read searchParams); only metadata is cached.
const METADATA_REVALIDATE = 600
// SnowObs caches each response for 60s, so holding the table's for as long
// costs no freshness and spares a function waiting on it per view.
const TABLE_REVALIDATE = 60

/** What the views show: a station page, or one tracked station assembled on the fly. */
export type StationViewSubject = {
  /** The station page's slug; null for a station no page lists. */
  slug: string | null
  archived: boolean
  stations: StationRef[]
  /** The readings the table shows; empty means all reported. */
  columns: StationColumn[]
  /** The tabs it shows, in order. */
  tabs: StationTabKey[]
}

/** Where the Download view's form fetches from, and how the saved file is named. */
export type StationCsvTarget = { action: string; filePrefix: string }

export type StationTabContext = {
  center: string
  subject: StationViewSubject
  pages: StationPageSummary[]
  timeZone: string
  csv: StationCsvTarget
}

export type StationTabView = {
  tabContent?: ReactNode
}

// Notes and the header's station list ride with the station metadata, so a
// 1-hour window is enough.
export async function loadStationMeta(
  center: string,
  stations: StationRef[],
): Promise<{ notes: StationNote[]; stations: StationSummary[] }> {
  const meta = await fetchStationTimeseries(center, stations, {
    revalidate: METADATA_REVALIDATE,
    windowHours: 1,
  })
  return {
    notes: stationNotes(meta.STATION),
    stations: stationSummaries(stations, meta.STATION),
  }
}

// A 1-hour window: only the station metadata is needed.
async function loadDataloggers(center: string, stations: StationRef[]): Promise<Datalogger[]> {
  const meta = await fetchStationTimeseries(center, stations, {
    revalidate: METADATA_REVALIDATE,
    windowHours: 1,
  })
  const byKey = new Map(meta.STATION.map((s) => [stationKey(s), s]))
  return stations.map((station) => {
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

async function csvTabView({ center, subject, csv }: StationTabContext): Promise<StationTabView> {
  return {
    tabContent: (
      <>
        <StationViewBar>
          <StationRangeTabs activeKey="csv" tabs={subject.tabs} />
        </StationViewBar>
        <StationCsvForm
          action={csv.action}
          filePrefix={csv.filePrefix}
          dataloggers={await loadDataloggers(center, subject.stations)}
          years={csvYears()}
        />
      </>
    ),
  }
}

function graphsTabView({ subject, pages, timeZone }: StationTabContext): StationTabView {
  return {
    tabContent: (
      <StationGraphs
        stations={subject.stations}
        presets={STATION_GRAPH_PRESETS}
        currentSlug={subject.slug}
        pages={pages}
        timeZone={timeZone}
        tabs={<StationRangeTabs activeKey="graphs" tabs={subject.tabs} />}
      />
    ),
  }
}

/** The table's query params: a preset `period`, or a custom `from`/`to` that wins when valid. */
export type TableRangeParams = { period?: string; from?: string; to?: string }

function tableWindow(
  period: ReturnType<typeof resolveTablePeriod>,
  custom: DateRange | null,
  timeZone: string,
  now: Date,
) {
  if (!custom) return { windowHours: period.hoursBack(now, timeZone) }
  const { from, to } = customRangeBounds(custom, timeZone, now)
  // A range ending today leaves `end` unset so the fetch keeps its cache bucket.
  return to ? { start: from, end: to } : { start: from }
}

async function tableTabView(
  { center, subject, timeZone }: StationTabContext,
  params: TableRangeParams,
): Promise<StationTabView> {
  const now = new Date()
  const period = resolveTablePeriod(params.period)
  const custom = parseCustomRange(params.from, params.to, TABLE_MAX_CUSTOM_DAYS, timeZone, now)
  const response = await fetchStationTimeseries(center, subject.stations, {
    ...tableWindow(period, custom, timeZone, now),
    rawData: true,
    revalidate: TABLE_REVALIDATE,
  })
  const table = buildStationTable(center, response, resolveColumns(response, subject))
  return {
    tabContent: (
      <StationTableView
        table={table}
        activePeriodKey={period.key}
        customRange={custom}
        timeZone={timeZone}
        tabs={<StationRangeTabs activeKey="table" tabs={subject.tabs} />}
      />
    ),
  }
}

export async function resolveTabView(
  context: StationTabContext,
  rangeParam: string | undefined,
  tableParams: TableRangeParams,
): Promise<StationTabView> {
  const { subject } = context
  const { tab, period } = resolveStationTab(subject.tabs, subject.archived, rangeParam)
  if (tab === 'csv') return csvTabView(context)
  if (tab === 'graphs') return graphsTabView(context)
  return tableTabView(context, { ...tableParams, period: tableParams.period ?? period })
}
