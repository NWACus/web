import { ValidTenantSlug } from '@/utilities/tenancy/avalancheCenters'
import { z } from 'zod'
import type { ResolvedRange, TrendInterval } from './analyticsRange'
import {
  breakdownQuery,
  deadClicksQuery,
  notFoundQuery,
  overviewCountsQuery,
  overviewVisitsQuery,
  sponsorsQuery,
  timeseriesQuery,
  type CenterQueryScope,
} from './centerAnalyticsQueries'
import { deadClickRowSchema, mergeDeadClicks } from './deadClicks'
import {
  queryHogQL,
  type HogQLStatement,
  type PostHogQueryConfig,
  type QueryRefresh,
} from './hogql'
import type {
  AnalyticsReport,
  BreakdownReport,
  Comparison,
  ListData,
  OverviewData,
  ReportDataMap,
  TimeseriesPoint,
} from './reportTypes'

const count = z.coerce.number()
// avgIf returns null over no rows
const average = z.coerce
  .number()
  .nullable()
  .transform((value) => value ?? 0)

const overviewCountsRowSchema = z.object({ visitors: count, visits: count, pageviews: count })
const overviewVisitsRowSchema = z.object({
  bounce_rate: average,
  previous_bounce_rate: average,
  visit_duration: average,
  previous_visit_duration: average,
})

const timeseriesRowSchema = z.object({
  date: z.string(),
  visitors: count,
  visits: count,
  pageviews: count,
})
const breakdownRowSchema = z.object({
  label: z.string(),
  visitors: count,
  visits: count,
  pageviews: count,
})
const sponsorRowSchema = z.object({
  sponsor_id: z.string().nullable(),
  sponsor_name: z.string().nullable(),
  impressions: count,
  clicks: count,
})
const notFoundRowSchema = z.object({
  path: z.string(),
  referrer: z.string().nullable(),
  hits: count,
  people: count,
})

/** What a report gets to work with: its center and range, and a HogQL runner bound to both caches. */
type ReportContext = {
  scope: CenterQueryScope
  query: <Row>(statement: HogQLStatement, rowSchema: z.ZodType<Row>) => Promise<Row[]>
}

type ReportRegistry = {
  [K in AnalyticsReport]: (context: ReportContext) => Promise<ReportDataMap[K]>
}

const ratio = (numerator: number, denominator: number) =>
  denominator > 0 ? numerator / denominator : 0

const compare = (current: number, previous: number): Comparison => ({ current, previous })

const EMPTY_COUNTS = { visitors: 0, visits: 0, pageviews: 0 }
const EMPTY_VISITS = {
  bounce_rate: 0,
  previous_bounce_rate: 0,
  visit_duration: 0,
  previous_visit_duration: 0,
}

async function overview({ scope, query }: ReportContext): Promise<OverviewData> {
  const [[current = EMPTY_COUNTS], [previous = EMPTY_COUNTS], [visits = EMPTY_VISITS]] =
    await Promise.all([
      query(overviewCountsQuery(scope, 'current'), overviewCountsRowSchema),
      query(overviewCountsQuery(scope, 'previous'), overviewCountsRowSchema),
      query(overviewVisitsQuery(scope), overviewVisitsRowSchema),
    ])
  return {
    visitors: compare(current.visitors, previous.visitors),
    visits: compare(current.visits, previous.visits),
    pageviews: compare(current.pageviews, previous.pageviews),
    viewsPerVisit: compare(
      ratio(current.pageviews, current.visits),
      ratio(previous.pageviews, previous.visits),
    ),
    bounceRate: compare(visits.bounce_rate, visits.previous_bounce_rate),
    visitDuration: compare(visits.visit_duration, visits.previous_visit_duration),
  }
}

type TimeseriesRow = z.infer<typeof timeseriesRowSchema>
type FillRange = Pick<ResolvedRange, 'from' | 'to' | 'bucket' | 'ongoing'>

const isoDay = (date: Date) => date.toISOString().slice(0, 10)

/** The first day of the bucket holding `iso`. Plain calendar dates, so UTC math is exact. */
function bucketStart(iso: string, bucket: TrendInterval): Date {
  const date = new Date(`${iso}T00:00:00Z`)
  // ISO weeks start on Monday: getUTCDay() is 0 for Sunday
  if (bucket === 'week') date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7))
  if (bucket === 'month') date.setUTCDate(1)
  return date
}

function nextBucket(start: Date, bucket: TrendInterval): Date {
  const next = new Date(start)
  if (bucket === 'month') next.setUTCMonth(next.getUTCMonth() + 1)
  else next.setUTCDate(next.getUTCDate() + (bucket === 'week' ? 7 : 1))
  return next
}

const NO_EVENTS = { visitors: 0, visits: 0, pageviews: 0 }
const later = (a: string, b: string) => (a > b ? a : b)
const earlier = (a: string, b: string) => (a < b ? a : b)

/** One bucket clipped to the range, partial when the range or today cuts it short. */
function bucketPoint(start: Date, next: Date, range: FillRange, counts = NO_EVENTS) {
  const date = isoDay(start)
  const lastDay = isoDay(new Date(next.getTime() - 86_400_000))
  const from = later(date, range.from)
  const to = earlier(lastDay, range.to)
  const cutShort = from !== date || to !== lastDay
  const stillCounting = range.ongoing && to === range.to
  const { visitors, visits, pageviews } = counts
  return { date, from, to, partial: cutShort || stillCounting, visitors, visits, pageviews }
}

/** Fills buckets with no events so the chart shows zeros instead of gaps. */
export function fillTimeseries(rows: TimeseriesRow[], range: FillRange): TimeseriesPoint[] {
  const byDate = new Map(rows.map((row) => [row.date, row]))
  const points: TimeseriesPoint[] = []
  let start = bucketStart(range.from, range.bucket)
  while (isoDay(start) <= range.to) {
    const next = nextBucket(start, range.bucket)
    points.push(bucketPoint(start, next, range, byDate.get(isoDay(start))))
    start = next
  }
  return points
}

const breakdown =
  <K extends BreakdownReport>(report: K) =>
  async ({ scope, query }: ReportContext): Promise<ListData<K>> => ({
    rows: await query(breakdownQuery(scope, report), breakdownRowSchema),
  })

/**
 * Every report the endpoint serves. To add one: give its data a schema in reportTypes.ts, add it
 * here (the type requires it), and render it on the page.
 */
const REPORTS: ReportRegistry = {
  overview,
  timeseries: async ({ scope, query }) => ({
    bucket: scope.range.bucket,
    points: fillTimeseries(await query(timeseriesQuery(scope), timeseriesRowSchema), scope.range),
  }),
  pages: breakdown('pages'),
  entryPages: breakdown('entryPages'),
  exitPages: breakdown('exitPages'),
  referrers: breakdown('referrers'),
  channels: breakdown('channels'),
  cities: breakdown('cities'),
  regions: breakdown('regions'),
  countries: breakdown('countries'),
  deviceTypes: breakdown('deviceTypes'),
  browsers: breakdown('browsers'),
  operatingSystems: breakdown('operatingSystems'),
  sponsors: async ({ scope, query }) => ({
    rows: (await query(sponsorsQuery(scope), sponsorRowSchema)).map((row) => ({
      sponsorId: row.sponsor_id,
      name: row.sponsor_name?.trim() || `Sponsor ${row.sponsor_id ?? '?'}`,
      impressions: row.impressions,
      clicks: row.clicks,
      clickThroughRate: row.impressions > 0 ? row.clicks / row.impressions : null,
    })),
  }),
  notFound: async ({ scope, query }) => ({
    rows: await query(notFoundQuery(scope), notFoundRowSchema),
  }),
  deadClicks: async ({ scope, query }) => ({
    rows: mergeDeadClicks(await query(deadClicksQuery(scope), deadClickRowSchema)),
  }),
}

/** Runs one report's queries for one center and range. Throws so a failure is never cached. */
export function fetchReport<K extends AnalyticsReport>(
  config: PostHogQueryConfig,
  slug: ValidTenantSlug,
  range: ResolvedRange,
  report: K,
  refresh: QueryRefresh = 'blocking',
): Promise<ReportDataMap[K]> {
  return REPORTS[report]({
    scope: { slug, range },
    query: (statement, rowSchema) => queryHogQL(config, statement, rowSchema, refresh),
  })
}
