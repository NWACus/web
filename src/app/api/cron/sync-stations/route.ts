import { StationSyncResult, syncStations } from '@/services/snowobs/syncStations'
import configPromise from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

// Keeps the stations collection in step with SnowObs, for every center that has
// an enabled SnowObs config. Schedule lives in vercel.json.

export const dynamic = 'force-dynamic'
export const maxDuration = 120

// Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. payload.auth() is no
// use here -- a cron has no user session.
function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return process.env.NODE_ENV !== 'production'
  return request.headers.get('authorization') === `Bearer ${secret}`
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await getPayload({ config: configPromise })

  // SnowObs config lives on each center's Settings, under the SnowObs tab.
  const { docs: configs } = await payload.find({
    collection: 'settings',
    where: { 'snowobs.weatherPagesEnabled': { equals: true } },
    limit: 100,
    depth: 1,
  })

  const results: StationSyncResult[] = []
  const failures: { tenant: string; error: string }[] = []

  for (const config of configs) {
    const tenant = typeof config.tenant === 'object' ? config.tenant : null
    const snowobs = config.snowobs
    if (!tenant || !snowobs?.source || !snowobs?.token) {
      payload.logger.warn({ settings: config.id }, 'snowobs settings incomplete; skipped')
      continue
    }

    try {
      // One center's outage must not stop the others syncing.
      results.push(
        await syncStations(payload, {
          tenantId: tenant.id,
          tenantSlug: tenant.slug,
          source: snowobs.source,
          token: snowobs.token,
        }),
      )
    } catch (error) {
      payload.logger.error({ err: error, tenant: tenant.slug }, 'station sync failed')
      failures.push({
        tenant: tenant.slug,
        error: error instanceof Error ? error.message : 'failed',
      })
    }
  }

  // A partial failure is still a failure -- returning 500 is what puts it in
  // front of somebody rather than leaving it in a log nobody reads.
  return NextResponse.json({ results, failures }, { status: failures.length ? 500 : 200 })
}
