import { format, subDays } from 'date-fns'

// The NAC widget's own date presets; `days: null` is "This Season"
export const DATE_RANGES = [
  { value: 'pastDay', label: 'Past Day', days: 1 },
  { value: 'past3Days', label: 'Past 3 Days', days: 3 },
  { value: 'pastWeek', label: 'Past Week', days: 7 },
  { value: 'past2Weeks', label: 'Past 2 Weeks', days: 14 },
  { value: 'pastMonth', label: 'Past Month', days: 30 },
  { value: 'thisSeason', label: 'This Season', days: null },
] as const

export type DateRange = (typeof DATE_RANGES)[number]['value']

// What the widget shows when the URL carries no dates
export const DEFAULT_DATE_RANGE: DateRange = 'past2Weeks'

export type ObservationsWidgetFilters = {
  tab?: 'observations' | 'avalanches' | null
  avalanchesObservedOnly?: boolean | null
  dateRange?: DateRange | null
  zones?: string[] | null
}

// The widget's seasons start on Sep 1
function seasonStart(today: Date): Date {
  const year = today.getMonth() >= 8 ? today.getFullYear() : today.getFullYear() - 1
  return new Date(year, 8, 1)
}

function startDate(dateRange: DateRange, today: Date): Date {
  const season = seasonStart(today)
  const days = DATE_RANGES.find((range) => range.value === dateRange)?.days ?? null
  if (days === null) return season
  const start = subDays(today, days)
  return start < season ? season : start
}

/**
 * The widget hash path that opens the observations widget pre-filtered. The widget reads its
 * initial filters from this query, serialized the way it writes them itself: dates as
 * YYYY-MM-DD, everything else as JSON. Dates are relative to `today` in the visitor's timezone.
 */
export function observationsWidgetPath(filters: ObservationsWidgetFilters, today: Date): string {
  const { tab, avalanchesObservedOnly, dateRange, zones } = filters
  const params = new URLSearchParams()

  if (zones && zones.length > 0) params.set('zone', JSON.stringify(zones))

  if (dateRange && dateRange !== DEFAULT_DATE_RANGE) {
    params.set('startDate', format(startDate(dateRange, today), 'yyyy-MM-dd'))
    params.set('endDate', format(today, 'yyyy-MM-dd'))
  }

  if (tab !== 'avalanches' && avalanchesObservedOnly) params.set('avalancheObs', 'true')

  const path = tab === 'avalanches' ? '/view/avalanches' : '/view/observations'
  const query = params.toString()
  return query ? `${path}?${query}` : path
}
