import { ValidTenantSlug } from '@/utilities/tenancy/avalancheCenters'
import { unstable_cache } from 'next/cache'
import { fetchCenterAnalytics, type CenterAnalytics } from './centerAnalytics'
import { getPostHogQueryConfig } from './hogql'

export const CENTER_ANALYTICS_CACHE_SECONDS = 60 * 60
export const CENTER_ANALYTICS_CACHE_TAG = 'center-analytics'

/**
 * One PostHog round trip per center per hour, shared by every admin who loads the dashboard.
 * Failures throw out of the cached function, so nothing is stored and the next load retries.
 */
export function getCachedCenterAnalytics(slug: ValidTenantSlug): Promise<CenterAnalytics> {
  return unstable_cache(
    async () => {
      const config = getPostHogQueryConfig()
      if (!config) throw new Error('PostHog query API is not configured')
      return fetchCenterAnalytics(config, slug)
    },
    [CENTER_ANALYTICS_CACHE_TAG, slug],
    { revalidate: CENTER_ANALYTICS_CACHE_SECONDS, tags: [CENTER_ANALYTICS_CACHE_TAG] },
  )()
}
