import { StationSyncResult, syncStations } from '@/services/snowobs/syncStations'
import { SyncTarget, syncTargetFrom } from '@/services/snowobs/syncTargets'
import configPromise from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { BasePayload, getPayload } from 'payload'

// Keeps the stations collection in step with SnowObs, for every center that has
// an enabled SnowObs config. Schedule lives in vercel.json.

export const dynamic = 'force-dynamic'
export const maxDuration = 120

type Failure = { tenant: string; error: string }

// Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. payload.auth() is no
// use here -- a cron has no user session.
function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return process.env.NODE_ENV !== 'production'
  return request.headers.get('authorization') === `Bearer ${secret}`
}

// Every center with the weather pages switched on and a complete SnowObs
// config. An incomplete one is logged rather than failing the run.
async function syncTargets(payload: BasePayload): Promise<SyncTarget[]> {
  const { docs } = await payload.find({
    collection: 'settings',
    where: { 'snowobs.weatherPagesEnabled': { equals: true } },
    limit: 100,
    depth: 1,
  })

  return docs.flatMap((settings) => {
    const target = syncTargetFrom(settings)
    if (target) return [target]
    payload.logger.warn({ settings: settings.id }, 'snowobs settings incomplete; skipped')
    return []
  })
}

// One center's outage must not stop the others syncing, so a failure is a value
// rather than a throw.
async function syncOne(
  payload: BasePayload,
  target: SyncTarget,
): Promise<{ result?: StationSyncResult; failure?: Failure }> {
  try {
    return { result: await syncStations(payload, target) }
  } catch (error) {
    payload.logger.error({ err: error, tenant: target.tenantSlug }, 'station sync failed')
    return {
      failure: {
        tenant: target.tenantSlug,
        error: error instanceof Error ? error.message : 'failed',
      },
    }
  }
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await getPayload({ config: configPromise })
  const targets = await syncTargets(payload)
  const outcomes = await Promise.all(targets.map((target) => syncOne(payload, target)))

  const results = outcomes.flatMap((outcome) => (outcome.result ? [outcome.result] : []))
  const failures = outcomes.flatMap((outcome) => (outcome.failure ? [outcome.failure] : []))

  // A partial failure is still a failure -- returning 500 is what puts it in
  // front of somebody rather than leaving it in a log nobody reads.
  return NextResponse.json({ results, failures }, { status: failures.length ? 500 : 200 })
}
