// The contract between the analytics endpoint and the admin page: every report and the shape of its
// data. Shared with client code, so keep this file free of server imports.
import { z } from 'zod'
import { BASELINES, TREND_INTERVALS } from './analyticsRange'

const comparisonSchema = z.object({ current: z.number(), previous: z.number() })
export type Comparison = z.infer<typeof comparisonSchema>

export const overviewSchema = z.object({
  visitors: comparisonSchema,
  visits: comparisonSchema,
  pageviews: comparisonSchema,
  viewsPerVisit: comparisonSchema,
  /** 0..1 */
  bounceRate: comparisonSchema,
  /** Seconds */
  visitDuration: comparisonSchema,
})
export type OverviewData = z.infer<typeof overviewSchema>

const timeseriesPointSchema = z.object({
  /** The bucket's first day, which can fall before the range for a week or month. */
  date: z.string(),
  /** The days of the range the bucket covers, inclusive. */
  from: z.string(),
  to: z.string(),
  /** Cut short by the range's edges or by today still being under way. */
  partial: z.boolean(),
  visitors: z.number(),
  visits: z.number(),
  pageviews: z.number(),
})
export type TimeseriesPoint = z.infer<typeof timeseriesPointSchema>

export const timeseriesSchema = z.object({
  bucket: z.enum(TREND_INTERVALS),
  points: z.array(timeseriesPointSchema),
})
export type TimeseriesData = z.infer<typeof timeseriesSchema>

const breakdownRowSchema = z.object({
  label: z.string(),
  visitors: z.number(),
  visits: z.number(),
  pageviews: z.number(),
})

const sponsorRowSchema = z.object({
  sponsorId: z.string().nullable(),
  name: z.string(),
  impressions: z.number(),
  clicks: z.number(),
  clickThroughRate: z.number().nullable(),
})

const notFoundRowSchema = z.object({
  path: z.string(),
  referrer: z.string().nullable(),
  hits: z.number(),
  people: z.number(),
})

const deadClickRowSchema = z.object({
  path: z.string(),
  label: z.string(),
  clicks: z.number(),
  people: z.number(),
})
export type DeadClickRow = z.infer<typeof deadClickRowSchema>

/** The most rows a list query returns; the card shows fewer until "Show all". */
export const LIST_ROW_CAP = 100

/** Top-N lists of `$pageview`s grouped by one property; the queries are in centerAnalyticsQueries.ts. */
const breakdownRows = {
  pages: breakdownRowSchema,
  entryPages: breakdownRowSchema,
  exitPages: breakdownRowSchema,
  referrers: breakdownRowSchema,
  channels: breakdownRowSchema,
  cities: breakdownRowSchema,
  regions: breakdownRowSchema,
  countries: breakdownRowSchema,
  deviceTypes: breakdownRowSchema,
  browsers: breakdownRowSchema,
  operatingSystems: breakdownRowSchema,
}
export type BreakdownReport = keyof typeof breakdownRows

/** Every report whose data is `{ rows }`, and the shape of one row. */
const listRows = {
  ...breakdownRows,
  sponsors: sponsorRowSchema,
  notFound: notFoundRowSchema,
  deadClicks: deadClickRowSchema,
}
export type ListReport = keyof typeof listRows
export type ListRowMap = { [K in ListReport]: z.infer<(typeof listRows)[K]> }
export type ListData<K extends ListReport> = { rows: ListRowMap[K][] }

/** Typed per key, so `LIST_ROW_SCHEMAS[report]` parses to that report's row even for a generic key. */
export const LIST_ROW_SCHEMAS: { [K in ListReport]: z.ZodType<ListRowMap[K]> } = listRows

/** What each report returns. The server's registry in reports.ts must provide every key. */
export type ReportDataMap = { overview: OverviewData; timeseries: TimeseriesData } & {
  [K in ListReport]: ListData<K>
}
export type AnalyticsReport = keyof ReportDataMap
export type ReportData = ReportDataMap[AnalyticsReport]

export function isAnalyticsReport(value: unknown): value is AnalyticsReport {
  return (
    value === 'overview' ||
    value === 'timeseries' ||
    (typeof value === 'string' && Object.hasOwn(listRows, value))
  )
}

export const reportRangeSchema = z.object({
  from: z.string(),
  to: z.string(),
  previousFrom: z.string(),
  previousTo: z.string(),
  baseline: z.enum(BASELINES),
  timezone: z.string(),
})
export type ReportRange = z.infer<typeof reportRangeSchema>

export type ReportResponse = { report: AnalyticsReport; range: ReportRange; data: ReportData }

/** Ranges up to this many days load quickly enough that nobody is asked first. */
export const PROMPT_ABOVE_DAYS = 45

export type LoadEstimate = {
  /** Something warm will answer: the server's cache or PostHog's. */
  cached: boolean
  /** Rough cold-load time for the whole page, in seconds. */
  seconds: number
}

/**
 * Measured on the Avy project (Nov 2026, queries in parallel, forced recalculation): a cold 30-day
 * page took 9 to 13 s and a year 13 to 17 s, plus room for the browser and a busy PostHog.
 */
export function estimateColdSeconds(days: number): number {
  return Math.round(10 + days * 0.03)
}

/** Percentage change from `previous` to `current`, or null when there is no baseline. */
export function percentChange({ current, previous }: Comparison): number | null {
  if (previous <= 0) return null
  return ((current - previous) / previous) * 100
}
