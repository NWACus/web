import { ValidTenantSlug } from '@/utilities/tenancy/avalancheCenters'
import { rangeDays, type ResolvedRange } from './analyticsRange'
import { overviewCountsQuery } from './centerAnalyticsQueries'
import { wasRecentlyLoaded } from './getCachedPanel'
import { probeQueryCache, type PostHogQueryConfig } from './hogql'
import { estimateColdSeconds, PROMPT_ABOVE_DAYS, type LoadEstimate } from './panelTypes'

export async function estimateLoad(
  config: PostHogQueryConfig,
  slug: ValidTenantSlug,
  range: ResolvedRange,
): Promise<LoadEstimate> {
  const days = rangeDays(range)
  const seconds = estimateColdSeconds(days)
  if (days <= PROMPT_ABOVE_DAYS || wasRecentlyLoaded(slug, range)) return { cached: true, seconds }
  // The overview is the first query every load runs, so its cache state stands for the page's
  const cached = await probeQueryCache(config, overviewCountsQuery({ slug, range }, 'current'))
  return { cached, seconds }
}
