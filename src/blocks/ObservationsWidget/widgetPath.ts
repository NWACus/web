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
  // A preset, or a past season stored as its years, e.g. '2024-25'
  dateRange?: string | null
  zones?: string[] | null
}

function isDateRange(value: string): value is DateRange {
  return DATE_RANGES.some((range) => range.value === value)
}

// The widget's seasons run Sep 1 to Aug 31 and are named by the year they end in
export function seasonEndYear(today: Date): number {
  return today.getMonth() >= 8 ? today.getFullYear() + 1 : today.getFullYear()
}

function seasonStart(today: Date): Date {
  return new Date(seasonEndYear(today) - 1, 8, 1)
}

function twoDigits(year: number): string {
  return String(year % 100).padStart(2, '0')
}

// '24/25' for the season ending in 2025
function seasonYears(endYear: number): string {
  return `${twoDigits(endYear - 1)}/${twoDigits(endYear)}`
}

function pastSeasonValue(endYear: number): string {
  return `${endYear - 1}-${twoDigits(endYear)}`
}

// The end year of a stored past season like '2024-25', or null for anything else
function parsePastSeason(value: string): number | null {
  // Four-digit start year, a hyphen, then the end year's last two digits
  const match = /^(\d{4})-(\d{2})$/.exec(value)
  if (!match) return null
  const endYear = Number(match[1]) + 1
  return match[2] === twoDigits(endYear) ? endYear : null
}

export function isValidDateRange(value: string, today: Date): boolean {
  if (isDateRange(value)) return true
  const endYear = parsePastSeason(value)
  return endYear !== null && endYear < seasonEndYear(today)
}

export function dateRangeLabel(value: string, today: Date): string | null {
  if (value === 'thisSeason') return `This Season (${seasonYears(seasonEndYear(today))})`
  const preset = DATE_RANGES.find((range) => range.value === value)
  if (preset) return preset.label
  const endYear = parsePastSeason(value)
  return endYear === null ? null : `${seasonYears(endYear)} Season`
}

function pastSeasonValues(today: Date, firstSeasonEndYear: number): string[] {
  const values: string[] = []
  for (let endYear = seasonEndYear(today) - 1; endYear >= firstSeasonEndYear; endYear--) {
    values.push(pastSeasonValue(endYear))
  }
  return values
}

/**
 * The presets, then each past season back to `firstSeasonEndYear` (null until it loads), newest
 * first. Like the widget, `firstSeasonEndYear` names a season by the year it ends in.
 */
export function dateRangeOptions(
  today: Date,
  firstSeasonEndYear: number | null,
  selected: string,
): { value: string; label: string }[] {
  const values = [
    ...DATE_RANGES.map((range) => range.value),
    ...(firstSeasonEndYear === null ? [] : pastSeasonValues(today, firstSeasonEndYear)),
  ]
  const options = values.map((value) => ({ value, label: dateRangeLabel(value, today) ?? value }))
  if (!selected || values.includes(selected)) return options

  // A saved season missing from the list stays so it still shows as picked, flagged once loaded
  const label = dateRangeLabel(selected, today) ?? selected
  const flag = firstSeasonEndYear === null ? '' : ' (not offered by the widget)'
  return [...options, { value: selected, label: `${label}${flag}` }]
}

function startDate(dateRange: DateRange, today: Date): Date {
  const season = seasonStart(today)
  const days = DATE_RANGES.find((range) => range.value === dateRange)?.days ?? null
  if (days === null) return season
  const start = subDays(today, days)
  return start < season ? season : start
}

function setDates(params: URLSearchParams, dateRange: string, today: Date) {
  const pastSeasonEndYear = parsePastSeason(dateRange)
  if (pastSeasonEndYear !== null) {
    // The widget writes the season alongside its dates; without it, the date slider covers this season
    params.set('season', String(pastSeasonEndYear))
    params.set('startDate', `${pastSeasonEndYear - 1}-09-01`)
    params.set('endDate', `${pastSeasonEndYear}-08-31`)
  } else if (isDateRange(dateRange) && dateRange !== DEFAULT_DATE_RANGE) {
    params.set('startDate', format(startDate(dateRange, today), 'yyyy-MM-dd'))
    params.set('endDate', format(today, 'yyyy-MM-dd'))
  }
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

  if (dateRange) setDates(params, dateRange, today)

  if (tab !== 'avalanches' && avalanchesObservedOnly) params.set('avalancheObs', 'true')

  const path = tab === 'avalanches' ? '/view/avalanches' : '/view/observations'
  const query = params.toString()
  return query ? `${path}?${query}` : path
}
