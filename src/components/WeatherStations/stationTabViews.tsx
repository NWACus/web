import type { Datalogger } from '@/components/WeatherStations/StationCsvForm'
import { StationCsvForm } from '@/components/WeatherStations/StationCsvForm'
import { STATION_GRAPH_PRESETS } from '@/components/WeatherStations/stationGraphPresets'
import { StationGraphs } from '@/components/WeatherStations/StationGraphs'
import { resolveTablePeriod } from '@/components/WeatherStations/stationPeriods'
import { StationRangeTabs } from '@/components/WeatherStations/StationRangeTabs'
import { StationTableView } from '@/components/WeatherStations/StationTableView'
import { StationViewBar } from '@/components/WeatherStations/StationViewBar'
import { resolveColumns } from '@/services/snowobs/deriveColumns'
import { fetchStationTimeseries } from '@/services/snowobs/snowobs'
import type { StationRef } from '@/services/snowobs/stationKey'
import { stationKey } from '@/services/snowobs/stationKey'
import type { StationTable } from '@/services/snowobs/tableHelpers'
import { buildStationTable, stationNotes } from '@/services/snowobs/tableHelpers'
import type { StationPageSummary } from '@/services/stations/getStationPages'
import type { StationColumn } from '@/services/stations/stationColumns'
import type { ReactNode } from 'react'

// The Table, Graphs and Download views, shared by a station page and a single
// tracked station's detail page.

// Matches the routes' ISR window; SnowObs stations report ~hourly.
const REVALIDATE_SECONDS = 600

/** What the views show: a station page, or one tracked station assembled on the fly. */
export type StationViewSubject = {
  /** The station page's slug; null for a station no page lists. */
  slug: string | null
  archived: boolean
  stations: StationRef[]
  /** The readings the table shows; empty means all reported. */
  columns: StationColumn[]
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
  table: StationTable | null
  tabContent?: ReactNode
}

// Notes ride with the station metadata, so a 1-hour window is enough.
export async function loadStationNotes(center: string, stations: StationRef[]) {
  const meta = await fetchStationTimeseries(center, stations, {
    revalidate: REVALIDATE_SECONDS,
    windowHours: 1,
  })
  return stationNotes(meta.STATION)
}

// A 1-hour window: only the station metadata is needed.
async function loadDataloggers(center: string, stations: StationRef[]): Promise<Datalogger[]> {
  const meta = await fetchStationTimeseries(center, stations, { windowHours: 1 })
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
    table: null,
    tabContent: (
      <>
        <StationViewBar>
          <StationRangeTabs activeKey="csv" />
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
    table: null,
    tabContent: (
      <StationGraphs
        stations={subject.stations}
        presets={STATION_GRAPH_PRESETS}
        currentSlug={subject.slug}
        pages={pages}
        timeZone={timeZone}
        tabs={<StationRangeTabs activeKey="graphs" />}
      />
    ),
  }
}

async function tableTabView(
  { center, subject, timeZone }: StationTabContext,
  periodParam?: string,
): Promise<StationTabView> {
  const period = resolveTablePeriod(periodParam)
  const response = await fetchStationTimeseries(center, subject.stations, {
    revalidate: REVALIDATE_SECONDS,
    windowHours: period.hoursBack(new Date(), timeZone),
    rawData: true,
  })
  const table = buildStationTable(center, response, resolveColumns(response, subject))
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
function defaultTabKey(subject: StationViewSubject): string {
  return subject.archived ? 'csv' : 'table'
}

// A Map, not an object: the key is raw user input (`?range=__proto__`).
const TAB_VIEWS = new Map<
  string,
  (context: StationTabContext) => StationTabView | Promise<StationTabView>
>([
  ['csv', csvTabView],
  ['graphs', graphsTabView],
])

export async function resolveTabView(
  context: StationTabContext,
  rangeParam?: string,
  periodParam?: string,
): Promise<StationTabView> {
  const build = TAB_VIEWS.get(rangeParam ?? defaultTabKey(context.subject))
  // Anything else is the table, including legacy `?range=24h` links.
  return build ? build(context) : tableTabView(context, periodParam ?? rangeParam)
}
