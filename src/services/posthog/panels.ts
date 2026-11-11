import { ValidTenantSlug } from '@/utilities/tenancy/avalancheCenters'
import { z } from 'zod'
import type { ResolvedRange } from './analyticsRange'
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
  type QueryPriority,
  type QueryRefresh,
} from './hogql'
import type {
  AnalyticsPanel,
  BreakdownPanel,
  Comparison,
  ListData,
  OverviewData,
  PanelDataMap,
  TimeseriesPoint,
} from './panelTypes'

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

/** What a panel gets to work with: its center and range, and a HogQL runner bound to both caches. */
type PanelContext = {
  scope: CenterQueryScope
  query: <Row>(statement: HogQLStatement, rowSchema: z.ZodType<Row>) => Promise<Row[]>
}

type PanelRegistry = {
  [K in AnalyticsPanel]: (context: PanelContext) => Promise<PanelDataMap[K]>
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

async function overview({ scope, query }: PanelContext): Promise<OverviewData> {
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

/** Fills buckets with no events so the chart shows zeros instead of gaps. */
export function fillTimeseries(
  points: TimeseriesPoint[],
  range: Pick<ResolvedRange, 'from' | 'to' | 'bucket'>,
): TimeseriesPoint[] {
  const byDate = new Map(points.map((point) => [point.date, point]))
  const filled: TimeseriesPoint[] = []
  const cursor = new Date(`${range.from}T00:00:00Z`)
  const last = new Date(`${range.to}T00:00:00Z`)
  if (range.bucket === 'week') {
    // ISO weeks start on Monday: getUTCDay() is 0 for Sunday
    cursor.setUTCDate(cursor.getUTCDate() - ((cursor.getUTCDay() + 6) % 7))
  }
  while (cursor.getTime() <= last.getTime()) {
    const date = cursor.toISOString().slice(0, 10)
    filled.push(byDate.get(date) ?? { date, visitors: 0, visits: 0, pageviews: 0 })
    cursor.setUTCDate(cursor.getUTCDate() + (range.bucket === 'week' ? 7 : 1))
  }
  return filled
}

const breakdown =
  <K extends BreakdownPanel>(panel: K) =>
  async ({ scope, query }: PanelContext): Promise<ListData<K>> => ({
    rows: await query(breakdownQuery(scope, panel), breakdownRowSchema),
  })

/**
 * Every panel the endpoint serves. To add one: give its data a schema in panelTypes.ts, add it
 * here (the type requires it), and render it on the page.
 */
const PANELS: PanelRegistry = {
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
  countries: breakdown('countries'),
  regions: breakdown('regions'),
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

// The top card of the page; its queries jump the queue
const FIRST_PANELS: ReadonlySet<AnalyticsPanel> = new Set(['overview', 'timeseries'])

/** Runs one panel's queries for one center and range. Throws so a failure is never cached. */
export function fetchPanel<K extends AnalyticsPanel>(
  config: PostHogQueryConfig,
  slug: ValidTenantSlug,
  range: ResolvedRange,
  panel: K,
  refresh: QueryRefresh = 'blocking',
): Promise<PanelDataMap[K]> {
  const priority: QueryPriority = FIRST_PANELS.has(panel) ? 'first' : 'normal'
  return PANELS[panel]({
    scope: { slug, range },
    query: (statement, rowSchema) => queryHogQL(config, statement, rowSchema, refresh, priority),
  })
}
