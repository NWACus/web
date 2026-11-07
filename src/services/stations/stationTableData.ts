import type { DateRange, StationPeriod } from '@/components/WeatherStations/stationPeriods'
import { customRangeBounds } from '@/components/WeatherStations/stationPeriods'
import { withElevationsIn } from '@/components/WeatherStations/stationTableUnits'
import { PRECIP_CUMSUM } from '@/services/snowobs/constants'
import { resolveColumns } from '@/services/snowobs/deriveColumns'
import type { FetchOptions } from '@/services/snowobs/snowobs'
import { fetchStationTimeseries } from '@/services/snowobs/snowobs'
import { fetchVariableRounding } from '@/services/snowobs/stationTracking'
import type { StationTable, StationTables } from '@/services/snowobs/tableHelpers'
import { buildStationTable } from '@/services/snowobs/tableHelpers'
import type { SnowObsTimeseriesResponse } from '@/services/snowobs/types/schemas'
import type { StationUnits } from '@/services/snowobs/units'
import { withStaleStations } from '@/services/stations/reportedReadings'
import type { ColumnOrderEntry, StationEntry } from '@/services/stations/stationColumns'
import { centerTimezone } from '@/utilities/tenancy/avalancheCenters'
import { tz } from '@date-fns/tz'
import { format } from 'date-fns'

// SnowObs caches each response for 60s, so holding the table's for as long
// costs no freshness and spares a function waiting on it per view.
const TABLE_REVALIDATE = 60
// A custom range that ended before today holds readings that won't change, so hold it a day.
export const PAST_RANGE_REVALIDATE = 24 * 60 * 60

export function tableWindow(period: StationPeriod): FetchOptions {
  return { windowHours: period.hours, revalidate: TABLE_REVALIDATE }
}

export function windowForDays(days: DateRange, timeZone: string, now: Date): FetchOptions {
  const { from, to } = customRangeBounds(days, timeZone, now)
  // A range ending today leaves `end` unset so the fetch keeps its cache bucket.
  return to
    ? { start: from, end: to, revalidate: PAST_RANGE_REVALIDATE }
    : { start: from, revalidate: TABLE_REVALIDATE }
}

function withYears(table: StationTable, center: string): StationTable {
  const zone = tz(centerTimezone(center))
  const rows = table.rows.map((row) => ({
    ...row,
    display: format(row.timestamp, 'MM/dd/yyyy HH:mm', { in: zone }),
  }))
  return { ...table, rows }
}

/** The Table tab's rows for a window, in both unit systems so the toggle is instant. */
export async function loadStationTables(
  center: string,
  subject: { stations: StationEntry[]; columnOrder: ColumnOrderEntry[] },
  window: FetchOptions,
  { chunked, showYear }: { chunked: boolean; showYear: boolean },
): Promise<StationTables> {
  // A failed metric read just drops the toggle.
  const [fetchedStandard, fetchedMetric, rounding] = await Promise.all([
    fetchStationTimeseries(center, subject.stations, { ...window, units: 'default' }),
    fetchStationTimeseries(center, subject.stations, { ...window, units: 'metric' }).catch(
      () => null,
    ),
    fetchVariableRounding(center),
  ])
  // A range that ended before today isn't missing a station that has since gone quiet.
  const reachesNow = !window.end
  const keepStale = async (response: SnowObsTimeseriesResponse, units: StationUnits) =>
    reachesNow ? withStaleStations(center, response, subject.stations, units) : { response }
  const [{ response: standard }, keptMetric] = await Promise.all([
    keepStale(fetchedStandard, 'default'),
    fetchedMetric && keepStale(fetchedMetric, 'metric'),
  ])
  const metric = keptMetric?.response
  const resolved = resolveColumns(standard, subject)
  // A running total can't start partway through a range, so a chunked table leaves it out.
  const columns = chunked ? resolved.filter((c) => c.variable !== PRECIP_CUMSUM) : resolved
  const finish = (table: StationTable) => (showYear ? withYears(table, center) : table)
  return {
    default: finish(buildStationTable(center, standard, columns, rounding)),
    metric: metric
      ? finish(withElevationsIn(buildStationTable(center, metric, columns, rounding), 'metric'))
      : null,
  }
}
