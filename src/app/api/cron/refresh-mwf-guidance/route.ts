import { refreshGuidance, type GuidanceTable } from '@/services/mwf/guidanceCache'
import configPromise from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

// Refreshes MWF model-guidance artifacts for every center with the MWF flag
// on. Schedule lives in vercel.json (hourly, the station-sync precedent).

export const dynamic = 'force-dynamic'
export const maxDuration = 120

// Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. payload.auth() is no
// use here -- a cron has no user session.
function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return process.env.NODE_ENV !== 'production'
  return request.headers.get('authorization') === `Bearer ${secret}`
}

const TABLES: GuidanceTable[] = ['precip', 'temps', 'winds']

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await getPayload({ config: configPromise })
  const { docs: settings } = await payload.find({
    collection: 'settings',
    where: { 'nativeProducts.mwf': { equals: true } },
    limit: 100,
    depth: 1,
  })

  const results: Array<{ tenant: string; table: GuidanceTable; status: string }> = []
  const failures: Array<{ tenant: string; error: string }> = []

  for (const setting of settings) {
    const tenant = typeof setting.tenant === 'object' ? setting.tenant : null
    if (!tenant || !setting.mwf) continue
    for (const table of TABLES) {
      try {
        // One center's outage must not stop the others refreshing.
        const artifact = await refreshGuidance(tenant.id, table, setting.mwf, { force: true })
        results.push({
          tenant: tenant.slug,
          table,
          status: artifact
            ? (artifact.refreshError ??
              (artifact.models.every((m) => m.status === 'loaded') ? 'ok' : 'partial'))
            : 'no models configured',
        })
      } catch (error) {
        payload.logger.error(
          { err: error, tenant: tenant.slug, table },
          'mwf guidance refresh failed',
        )
        failures.push({
          tenant: tenant.slug,
          error: error instanceof Error ? error.message : 'failed',
        })
      }
    }
  }

  // A partial failure is still a failure -- returning 500 is what puts it in
  // front of somebody rather than leaving it in a log nobody reads.
  return NextResponse.json({ results, failures }, { status: failures.length ? 500 : 200 })
}
