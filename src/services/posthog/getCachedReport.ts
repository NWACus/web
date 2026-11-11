import { ValidTenantSlug } from '@/utilities/tenancy/avalancheCenters'
import { revalidateTag, unstable_cache } from 'next/cache'
import type { ResolvedRange } from './analyticsRange'
import { getPostHogQueryConfig, PostHogQueryError } from './hogql'
import { fetchReport } from './reports'
import type { AnalyticsReport, ReportData } from './reportTypes'

export const REPORT_CACHE_SECONDS = 10 * 60

// Bump when a report's data shape changes, so entries cached by older code are not served
const REPORT_SHAPE_VERSION = 3

export const centerAnalyticsTag = (slug: ValidTenantSlug) => `center-analytics:${slug}`

// Concurrent identical requests (two admins, or a client retry) share one PostHog round trip.
const inFlight = new Map<string, Promise<ReportData>>()

function dedupe(key: string, run: () => Promise<ReportData>): Promise<ReportData> {
  const pending = inFlight.get(key)
  if (pending) return pending
  const promise = run().finally(() => inFlight.delete(key))
  inFlight.set(key, promise)
  return promise
}

/**
 * Ten minutes per center, range and report, so a reload or a colleague opening the same page costs
 * nothing. A forced refresh recalculates on PostHog's side too, then drops the center's entries so
 * the next ordinary load picks the fresh result up from PostHog's cache.
 */
export async function getCachedReport(
  slug: ValidTenantSlug,
  range: ResolvedRange,
  report: AnalyticsReport,
  force = false,
): Promise<ReportData> {
  const config = getPostHogQueryConfig()
  if (!config) throw new PostHogQueryError('PostHog query API is not configured')

  if (force) {
    const data = await fetchReport(config, slug, range, report, 'force_blocking')
    revalidateTag(centerAnalyticsTag(slug))
    return data
  }

  const key = [
    `center-analytics-v${REPORT_SHAPE_VERSION}`,
    slug,
    range.from,
    range.to,
    range.end.toISOString(),
    report,
  ]
  return dedupe(key.join('|'), () =>
    unstable_cache(() => fetchReport(config, slug, range, report), key, {
      revalidate: REPORT_CACHE_SECONDS,
      tags: [centerAnalyticsTag(slug)],
    })(),
  )
}
