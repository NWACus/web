import { ValidTenantSlug } from '@/utilities/tenancy/avalancheCenters'
import { revalidateTag, unstable_cache } from 'next/cache'
import type { ResolvedRange } from './analyticsRange'
import { getPostHogQueryConfig, PostHogQueryError } from './hogql'
import { fetchPanel } from './panels'
import type { AnalyticsPanel, PanelData } from './panelTypes'

export const PANEL_CACHE_SECONDS = 10 * 60

export const centerAnalyticsTag = (slug: ValidTenantSlug) => `center-analytics:${slug}`

// Concurrent identical requests (two admins, or a client retry) share one PostHog round trip.
const inFlight = new Map<string, Promise<PanelData>>()

function dedupe(key: string, run: () => Promise<PanelData>): Promise<PanelData> {
  const pending = inFlight.get(key)
  if (pending) return pending
  const promise = run().finally(() => inFlight.delete(key))
  inFlight.set(key, promise)
  return promise
}

/**
 * Ten minutes per center, range and panel, so a reload or a colleague opening the same page costs
 * nothing. A forced refresh recalculates on PostHog's side too, then drops the center's entries so
 * the next ordinary load picks the fresh result up from PostHog's cache.
 */
export async function getCachedPanel(
  slug: ValidTenantSlug,
  range: ResolvedRange,
  panel: AnalyticsPanel,
  force = false,
): Promise<PanelData> {
  const config = getPostHogQueryConfig()
  if (!config) throw new PostHogQueryError('PostHog query API is not configured')

  if (force) {
    const data = await fetchPanel(config, slug, range, panel, 'force_blocking')
    revalidateTag(centerAnalyticsTag(slug))
    return data
  }

  const key = ['center-analytics', slug, range.from, range.to, range.end.toISOString(), panel]
  return dedupe(key.join('|'), () =>
    unstable_cache(() => fetchPanel(config, slug, range, panel), key, {
      revalidate: PANEL_CACHE_SECONDS,
      tags: [centerAnalyticsTag(slug)],
    })(),
  )
}
