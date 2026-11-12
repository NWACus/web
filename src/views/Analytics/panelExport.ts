/**
 * The trend and stats-row CSVs, and every export's file name; list CSVs come from their specs in
 * lists.ts. Numbers are unformatted so they sort and sum in a spreadsheet. Pure, so the files are
 * unit-testable without a download.
 */
import type { OverviewData, ReportRange, TimeseriesData } from '@/services/posthog/reportTypes'
import { toCsv } from '@/utilities/export/csv'
import { toKebabCase } from '@/utilities/toKebabCase'
import { round } from './lists'

/** e.g. `nwac-top-pages-2026-10-01-to-2026-10-31.csv`. */
export function analyticsExportFilename(
  center: string,
  panelLabel: string,
  range: { from: string; to: string },
  extension: 'csv' | 'png',
): string {
  return `${center}-${toKebabCase(panelLabel)}-${range.from}-to-${range.to}.${extension}`
}

/** The stats row: one line per metric, this period beside the previous one. */
export function overviewCsv(data: OverviewData, range: ReportRange): string {
  const metrics: Array<[string, keyof OverviewData, (value: number) => string]> = [
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
/** Weeks and months give the days each row covers, so partial ones at the edges read as such. */
export function timeseriesCsv(data: TimeseriesData): string {
  const byDay = data.bucket === 'day'
  return toCsv([
    [...(byDay ? ['Date'] : ['From', 'To']), 'Visitors', 'Visits', 'Pageviews'],
    ...data.points.map((point) => [
      ...(byDay ? [point.date] : [point.from, point.to]),
      String(point.visitors),
      String(point.visits),
      String(point.pageviews),
    ]),
  ])
}
