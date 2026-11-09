import { ValidTenantSlug } from '@/utilities/tenancy/avalancheCenters'
import { z } from 'zod'
import {
  analyticsWindow,
  deadClicksQuery,
  devicesQuery,
  overviewQuery,
  sponsorsQuery,
  topPagesQuery,
  topReferrersQuery,
  topRegionsQuery,
  type CenterQueryScope,
} from './centerAnalyticsQueries'
import { deadClickRowSchema, mergeDeadClicks, type DeadClickTarget } from './deadClicks'
import { queryHogQL, type PostHogQueryConfig } from './hogql'

const count = z.coerce.number()

const overviewRowSchema = z.object({
  visitors: count,
  previous_visitors: count,
  sessions: count,
  previous_sessions: count,
  pageviews: count,
  previous_pageviews: count,
})

const pageRowSchema = z.object({ path: z.string(), pageviews: count, visitors: count })
const referrerRowSchema = z.object({ referrer: z.string(), visitors: count, sessions: count })
const deviceRowSchema = z.object({ device: z.string(), visitors: count, pageviews: count })
const regionRowSchema = z.object({ region: z.string(), visitors: count, pageviews: count })
const sponsorRowSchema = z.object({
  sponsor_id: z.string().nullable(),
  sponsor_name: z.string().nullable(),
  impressions: count,
  clicks: count,
})

export type Comparison = { current: number; previous: number }

export type SponsorPerformance = {
  sponsorId: string | null
  name: string
  impressions: number
  clicks: number
  /** Clicks per impression, or null when there were no impressions. */
  clickThroughRate: number | null
}

export type CenterAnalytics = {
  slug: ValidTenantSlug
  window: { start: string; previousStart: string; end: string }
  overview: { visitors: Comparison; sessions: Comparison; pageviews: Comparison }
  topPages: Array<{ path: string; pageviews: number; visitors: number }>
  topReferrers: Array<{ referrer: string; visitors: number; sessions: number }>
  devices: Array<{ device: string; visitors: number; pageviews: number }>
  topRegions: Array<{ region: string; visitors: number; pageviews: number }>
  sponsors: SponsorPerformance[]
  deadClicks: DeadClickTarget[]
}

/** Percentage change from `previous` to `current`, or null when there is no baseline. */
export function percentChange({ current, previous }: Comparison): number | null {
  if (previous <= 0) return null
  return ((current - previous) / previous) * 100
}

/** Runs every tile's query for one center. Throws on any failure so a partial result is never cached. */
export async function fetchCenterAnalytics(
  config: PostHogQueryConfig,
  slug: ValidTenantSlug,
  now = new Date(),
): Promise<CenterAnalytics> {
  const scope: CenterQueryScope = { slug, window: analyticsWindow(now) }

  const [overviewRows, topPages, topReferrers, devices, topRegions, sponsorRows, deadClickRows] =
    await Promise.all([
      queryHogQL(config, overviewQuery(scope), overviewRowSchema),
      queryHogQL(config, topPagesQuery(scope), pageRowSchema),
      queryHogQL(config, topReferrersQuery(scope), referrerRowSchema),
      queryHogQL(config, devicesQuery(scope), deviceRowSchema),
      queryHogQL(config, topRegionsQuery(scope), regionRowSchema),
      queryHogQL(config, sponsorsQuery(scope), sponsorRowSchema),
      queryHogQL(config, deadClicksQuery(scope), deadClickRowSchema),
    ])

  const overview = overviewRows[0]

  return {
    slug,
    window: {
      start: scope.window.start.toISOString(),
      previousStart: scope.window.previousStart.toISOString(),
      end: scope.window.end.toISOString(),
    },
    overview: {
      visitors: { current: overview?.visitors ?? 0, previous: overview?.previous_visitors ?? 0 },
      sessions: { current: overview?.sessions ?? 0, previous: overview?.previous_sessions ?? 0 },
      pageviews: { current: overview?.pageviews ?? 0, previous: overview?.previous_pageviews ?? 0 },
    },
    topPages,
    topReferrers,
    devices,
    topRegions,
    sponsors: sponsorRows.map((row) => ({
      sponsorId: row.sponsor_id,
      name: row.sponsor_name?.trim() || `Sponsor ${row.sponsor_id ?? '?'}`,
      impressions: row.impressions,
      clicks: row.clicks,
      clickThroughRate: row.impressions > 0 ? row.clicks / row.impressions : null,
    })),
    deadClicks: mergeDeadClicks(deadClickRows),
  }
}
