import { NWAC_DISPLAY_TIMEZONE } from '@/services/snowobs/constants'
import { TZDate } from '@date-fns/tz'
import { differenceInHours } from 'date-fns'

export type StationPeriod = { key: string; label: string; hoursBack: (now: Date) => number }

// Hours back to the most recent Oct 1 (the season anchor, display timezone).
export function seasonHours(now: Date): number {
  const local = new TZDate(now.getTime(), NWAC_DISPLAY_TIMEZONE)
  const year = local.getMonth() >= 9 ? local.getFullYear() : local.getFullYear() - 1
  const seasonStart = new TZDate(year, 9, 1, NWAC_DISPLAY_TIMEZONE)
  return Math.max(24, differenceInHours(now, seasonStart, { roundingMethod: 'ceil' }))
}

const WEEK_PERIOD: StationPeriod = { key: '7d', label: '7 days', hoursBack: () => 7 * 24 }

export const STATION_PERIODS: StationPeriod[] = [
  { key: '24h', label: '24 hours', hoursBack: () => 24 },
  WEEK_PERIOD,
  { key: '30d', label: '30 days', hoursBack: () => 30 * 24 },
  { key: '3m', label: '3 months', hoursBack: () => 91 * 24 },
  { key: '6m', label: '6 months', hoursBack: () => 182 * 24 },
  { key: 'season', label: 'Season', hoursBack: seasonHours },
]

export const GRAPH_PERIODS = STATION_PERIODS

export const DEFAULT_GRAPH_PERIOD = WEEK_PERIOD

// Tables cap at 30 days: longer graph periods aggregate to daily rows, which
// a row-per-observation table can't do.
export const TABLE_PERIODS = STATION_PERIODS.filter((p) => ['24h', '7d', '30d'].includes(p.key))

// Legacy `?range=24h`/`?range=7d` URLs resolve as period keys.
export function resolveTablePeriod(param: string | undefined): StationPeriod {
  return TABLE_PERIODS.find((p) => p.key === param) ?? TABLE_PERIODS[0]
}
