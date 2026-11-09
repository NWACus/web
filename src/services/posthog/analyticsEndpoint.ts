import { getUser } from '@/utilities/isUser'
import { AVALANCHE_CENTERS, isValidTenantSlug } from '@/utilities/tenancy/avalancheCenters'
import type { Endpoint, PayloadHandler, PayloadRequest } from 'payload'
import { resolveRange } from './analyticsRange'
import { getCachedPanel } from './getCachedPanel'
import { getPostHogQueryConfig, PostHogQueryError } from './hogql'
import { isAnalyticsPanel, type PanelResponse } from './panelTypes'

const json = (body: unknown, status = 200) => Response.json(body, { status })

function failureMessage(err: unknown): string {
  if (err instanceof PostHogQueryError && err.message.includes('did not finish')) {
    return 'PostHog took too long to answer. Try again, or pick a shorter range.'
  }
  return 'Site analytics are unavailable right now'
}

async function canReadTenant(req: PayloadRequest, slug: string): Promise<boolean> {
  const user = getUser(req)
  if (!user) return false
  const { totalDocs } = await req.payload.find({
    collection: 'tenants',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
    overrideAccess: false,
    user,
  })
  return totalDocs > 0
}

/**
 * `GET /api/analytics?center=nwac&from=2026-10-10&to=2026-11-09&panel=overview[&refresh=1]`
 * for the admin Site analytics page. Auth is Payload's; the center must be one the user can read.
 */
export const analyticsHandler: PayloadHandler = async (req) => {
  const params = req.searchParams
  const center = params.get('center')
  const panel = params.get('panel')
  if (!(center && isValidTenantSlug(center)) || !isAnalyticsPanel(panel)) {
    return json({ error: 'Unknown center or panel' }, 400)
  }
  if (!(await canReadTenant(req, center))) return json({ error: 'Not found' }, 404)
  if (!getPostHogQueryConfig()) return json({ error: 'Site analytics are not connected' }, 503)

  const range = resolveRange(
    { from: params.get('from') ?? '', to: params.get('to') ?? '' },
    AVALANCHE_CENTERS[center].timezone,
    new Date(),
  )
  if ('error' in range) return json({ error: range.error }, 400)

  try {
    const data = await getCachedPanel(center, range, panel, params.get('refresh') === '1')
    const body: PanelResponse = {
      panel,
      range: {
        from: range.from,
        to: range.to,
        previousFrom: range.previousFrom,
        previousTo: range.previousTo,
        timezone: range.timezone,
      },
      data,
    }
    return json(body)
  } catch (err) {
    req.payload.logger.warn({ err, center, panel }, 'Site analytics panel failed')
    return json({ error: failureMessage(err) }, 502)
  }
}

export const analyticsEndpoint: Endpoint = {
  path: '/analytics',
  method: 'get',
  handler: analyticsHandler,
}
