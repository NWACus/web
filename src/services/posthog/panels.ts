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
import { queryHogQL, type PostHogQueryConfig, type QueryRefresh } from './hogql'
import {
  BREAKDOWN_PANELS,
  type AnalyticsPanel,
  type BreakdownPanel,
  type Comparison,
  type PanelData,
  type TimeseriesPoint,
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
const breakdownRowSchema = z.object({ label: z.string(), visitors: count, secondary: count })
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

const ratio = (numerator: number, denominator: number) =>
  denominator > 0 ? numerator / denominator : 0

function isBreakdownPanel(panel: AnalyticsPanel): panel is BreakdownPanel {
  return BREAKDOWN_PANELS.some((candidate) => candidate === panel)
}

const EMPTY_COUNTS = { visitors: 0, visits: 0, pageviews: 0 }
const EMPTY_VISITS = {
  bounce_rate: 0,
  previous_bounce_rate: 0,
  visit_duration: 0,
  previous_visit_duration: 0,
}

const compare = (current: number, previous: number): Comparison => ({ current, previous })

async function fetchOverview(
  config: PostHogQueryConfig,
  scope: CenterQueryScope,
  refresh: QueryRefresh,
): Promise<PanelData> {
  const [[current = EMPTY_COUNTS], [previous = EMPTY_COUNTS], [visits = EMPTY_VISITS]] =
    await Promise.all([
      queryHogQL(config, overviewCountsQuery(scope, 'current'), overviewCountsRowSchema, refresh),
      queryHogQL(config, overviewCountsQuery(scope, 'previous'), overviewCountsRowSchema, refresh),
      queryHogQL(config, overviewVisitsQuery(scope), overviewVisitsRowSchema, refresh),
    ])
  return {
    kind: 'overview',
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

/** Runs one panel's query for one center and range. Throws so a failure is never cached. */
export async function fetchPanel(
  config: PostHogQueryConfig,
  slug: ValidTenantSlug,
  range: ResolvedRange,
  panel: AnalyticsPanel,
  refresh: QueryRefresh = 'blocking',
): Promise<PanelData> {
  const scope: CenterQueryScope = { slug, range }

  if (panel === 'overview') return fetchOverview(config, scope, refresh)

  if (panel === 'timeseries') {
    const rows = await queryHogQL(config, timeseriesQuery(scope), timeseriesRowSchema, refresh)
    return { kind: 'timeseries', bucket: range.bucket, points: fillTimeseries(rows, range) }
  }

  if (isBreakdownPanel(panel)) {
    const rows = await queryHogQL(config, breakdownQuery(scope, panel), breakdownRowSchema, refresh)
    return { kind: 'breakdown', rows }
  }

  if (panel === 'sponsors') {
    const rows = await queryHogQL(config, sponsorsQuery(scope), sponsorRowSchema, refresh)
    return {
      kind: 'sponsors',
      rows: rows.map((row) => ({
        sponsorId: row.sponsor_id,
        name: row.sponsor_name?.trim() || `Sponsor ${row.sponsor_id ?? '?'}`,
        impressions: row.impressions,
        clicks: row.clicks,
        clickThroughRate: row.impressions > 0 ? row.clicks / row.impressions : null,
      })),
    }
  }

  if (panel === 'notFound') {
    const rows = await queryHogQL(config, notFoundQuery(scope), notFoundRowSchema, refresh)
    return { kind: 'notFound', rows }
  }

  const rows = await queryHogQL(config, deadClicksQuery(scope), deadClickRowSchema, refresh)
  return { kind: 'deadClicks', rows: mergeDeadClicks(rows) }
}
