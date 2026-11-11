import { getUser } from '@/utilities/isUser'
import type { ValidTenantSlug } from '@/utilities/tenancy/avalancheCenters'
import { AVALANCHE_CENTERS, isValidTenantSlug } from '@/utilities/tenancy/avalancheCenters'
import type { Endpoint, PayloadHandler, PayloadRequest } from 'payload'
import { resolveRange, type ResolvedRange } from './analyticsRange'
import { getCachedReport } from './getCachedReport'
import { getPostHogQueryConfig, PostHogQueryError, type PostHogQueryConfig } from './hogql'
import { estimateLoad } from './loadEstimate'
import { isAnalyticsReport, type ReportResponse } from './reportTypes'

const json = (body: unknown, status = 200) => Response.json(body, { status })

function failureMessage(err: unknown): string {
  if (err instanceof PostHogQueryError && err.message.includes('did not finish')) {
    return 'PostHog took too long to answer. Try again, or pick a shorter range.'
  }
  if (err instanceof PostHogQueryError && err.context?.status === 429) {
    return 'PostHog is busy right now. Try again in a minute.'
  }
  return 'Web analytics are unavailable right now'
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

type Authorized = { center: ValidTenantSlug; range: ResolvedRange; config: PostHogQueryConfig }

/** Shared by both endpoints: a readable center, a valid range and configured credentials. */
async function authorize(req: PayloadRequest): Promise<Authorized | Response> {
  const params = req.searchParams
  const center = params.get('center')
  if (!(center && isValidTenantSlug(center))) return json({ error: 'Unknown center' }, 400)
  if (!(await canReadTenant(req, center))) return json({ error: 'Not found' }, 404)
  const config = getPostHogQueryConfig()
  if (!config) return json({ error: 'Web analytics are not connected' }, 503)

  const range = resolveRange(
    { from: params.get('from') ?? '', to: params.get('to') ?? '' },
    AVALANCHE_CENTERS[center].timezone,
    new Date(),
    params.get('interval'),
  )
  if ('error' in range) return json({ error: range.error }, 400)
  return { center, range, config }
}

/**
 * `GET /api/analytics?center=nwac&from=2026-10-10&to=2026-11-09&report=overview[&interval=week][&refresh=1]`
 * for the admin Web analytics page. Auth is Payload's; the center must be one the user can read.
 */
export const analyticsHandler: PayloadHandler = async (req) => {
  const report = req.searchParams.get('report')
  if (!isAnalyticsReport(report)) return json({ error: 'Unknown report' }, 400)
  const authorized = await authorize(req)
  if (authorized instanceof Response) return authorized
  const { center, range } = authorized

  try {
    const data = await getCachedReport(
      center,
      range,
      report,
      req.searchParams.get('refresh') === '1',
    )
    const body: ReportResponse = {
      report,
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
    req.payload.logger.warn({ err, center, report }, 'Web analytics report failed')
    return json({ error: failureMessage(err) }, 502)
  }
}

/** `GET /api/analytics/estimate?center&from&to`: whether a range is warm, and how long a cold load takes. */
export const analyticsEstimateHandler: PayloadHandler = async (req) => {
  const authorized = await authorize(req)
  if (authorized instanceof Response) return authorized
  const { center, range, config } = authorized
  try {
    return json(await estimateLoad(config, center, range))
  } catch (err) {
    req.payload.logger.warn({ err, center }, 'Web analytics estimate failed')
    // Unknown is treated as cold, so the page asks before a long load
    return json({ cached: false, seconds: 60 })
  }
}

export const analyticsEndpoint: Endpoint = {
  path: '/analytics',
  method: 'get',
  handler: analyticsHandler,
}

export const analyticsEstimateEndpoint: Endpoint = {
  path: '/analytics/estimate',
  method: 'get',
  handler: analyticsEstimateHandler,
}
