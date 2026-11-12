import { ValidTenantSlug } from '@/utilities/tenancy/avalancheCenters'
import { rangeDays, type ResolvedRange } from './analyticsRange'
import { overviewCountsQuery } from './centerAnalyticsQueries'
import { probeQueryCache, type PostHogQueryConfig } from './hogql'
import { estimateColdSeconds, PROMPT_ABOVE_DAYS, type LoadEstimate } from './reportTypes'

export async function estimateLoad(
  config: PostHogQueryConfig,
  slug: ValidTenantSlug,
  range: ResolvedRange,
): Promise<LoadEstimate> {
  const days = rangeDays(range)
  const seconds = estimateColdSeconds(days)
  if (days <= PROMPT_ABOVE_DAYS) return { cached: true, seconds }
  // Serverless instances share no memory, so PostHog's cache is the only signal worth reading.
  // The overview is the first query every load runs, so its state stands for the page's.
  const cached = await probeQueryCache(config, overviewCountsQuery({ slug, range }, 'current'))
  return { cached, seconds }
}
