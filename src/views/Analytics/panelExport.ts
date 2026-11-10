/**
 * What each analytics panel saves as CSV, and the file names. Columns follow the panel's on-screen
 * headings so a file reads like the card it came from; numbers are unformatted so they sort and
 * sum in a spreadsheet. Pure, so the files are unit-testable without a download.
 */
import type {
  BreakdownRow,
  DeadClickRow,
  NotFoundRow,
  OverviewData,
  PanelResponse,
  SponsorRow,
  TimeseriesData,
} from '@/services/posthog/panelTypes'
import { toCsv } from '@/utilities/export/csv'
import { toKebabCase } from '@/utilities/toKebabCase'

type Range = PanelResponse['range']

/** e.g. `nwac-top-pages-2026-10-01-to-2026-10-31.csv`. */
export function analyticsExportFilename(
  center: string,
  panelLabel: string,
  range: { from: string; to: string },
  extension: 'csv' | 'png',
): string {
  return `${center}-${toKebabCase(panelLabel)}-${range.from}-to-${range.to}.${extension}`
}

const round = (value: number, digits: number) => String(Number(value.toFixed(digits)))

/** The stats row: one line per metric, this period beside the previous one. */
export function overviewCsv(data: OverviewData, range: Range): string {
  const metrics: Array<[string, keyof Omit<OverviewData, 'kind'>, (value: number) => string]> = [
    ['Unique visitors', 'visitors', String],
    ['Total visits', 'visits', String],
    ['Total pageviews', 'pageviews', String],
    ['Views per visit', 'viewsPerVisit', (value) => round(value, 2)],
    ['Bounce rate (%)', 'bounceRate', (value) => round(value * 100, 1)],
    ['Visit duration (seconds)', 'visitDuration', (value) => round(value, 0)],
  ]
  return toCsv([
    ['Metric', `${range.from} to ${range.to}`, `${range.previousFrom} to ${range.previousTo}`],
    ...metrics.map(([label, key, format]) => [
      label,
      format(data[key].current),
      format(data[key].previous),
    ]),
  ])
}

/** Every bucket with all three series, whichever one the chart is showing. */
export function timeseriesCsv(data: TimeseriesData): string {
  return toCsv([
    [data.bucket === 'week' ? 'Week starting' : 'Date', 'Visitors', 'Visits', 'Pageviews'],
    ...data.points.map((point) => [
      point.date,
      String(point.visitors),
      String(point.visits),
      String(point.pageviews),
    ]),
  ])
}

export function breakdownCsv(
  rows: BreakdownRow[],
  tab: { rowLabel: string; secondaryLabel: string; display?: (label: string) => string },
): string {
  return toCsv([
    [tab.rowLabel, 'Visitors', tab.secondaryLabel],
    ...rows.map((row) => [
      tab.display ? tab.display(row.label) : row.label,
      String(row.visitors),
      String(row.secondary),
    ]),
  ])
}

/** Every sponsor, not just the ones the card shows before "Show all". */
export function sponsorsCsv(rows: SponsorRow[]): string {
  return toCsv([
    ['Sponsor', 'Impressions', 'Clicks', 'Click-through rate (%)'],
    ...rows.map((row) => [
      row.name,
      String(row.impressions),
      String(row.clicks),
      row.clickThroughRate === null ? '' : round(row.clickThroughRate * 100, 2),
    ]),
  ])
}

export function notFoundCsv(rows: NotFoundRow[]): string {
  return toCsv([
    ['Missing page', 'Referrer', 'People', 'Hits'],
    ...rows.map((row) => [
      row.path || '/',
      row.referrer ?? '',
      String(row.people),
      String(row.hits),
    ]),
  ])
}

export function deadClicksCsv(rows: DeadClickRow[]): string {
  return toCsv([
    ['What was clicked', 'Page', 'People', 'Clicks'],
    ...rows.map((row) => [row.label, row.path || '/', String(row.people), String(row.clicks)]),
  ])
}
