export type SyncTarget = {
  tenantId: number
  tenantSlug: string
  source: string
  token: string
}

/**
 * One settings document's runnable sync config, or null when the center enabled
 * the weather pages before pasting a token in.
 *
 * Lives apart from the cron route so tests can reach it without loading the
 * Payload config, and because quietly skipping a half-configured center is easy
 * to get wrong in a way nothing else notices.
 */
export function syncTargetFrom(settings: {
  tenant?: unknown
  snowobs?: { source?: string | null; token?: string | null } | null
}): SyncTarget | null {
  const tenant = settings.tenant
  if (!tenant || typeof tenant !== 'object') return null

  const { id, slug } = Object(tenant)
  const source = settings.snowobs?.source
  const token = settings.snowobs?.token
  if (!source || !token) return null

  return { tenantId: id, tenantSlug: slug, source, token }
}
