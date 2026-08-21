import { STATIONS_TENANT_SLUG } from '@/constants/weatherStations'
import { BATTERY_THRESHOLDS, scanBatteries, StationBattery } from '@/services/snowobs/battery'
import { generateBatteryAlertEmail } from '@/utilities/email/generateBatteryAlertEmail'
import { sendEmail } from '@/utilities/email/sendEmail'
import configPromise from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { BasePayload, getPayload } from 'payload'

// Weather station battery alerts, replacing the Django job in
// nwac/apps/weatherstations/models.py. Schedule lives in vercel.json.

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Comma-separated. Blank entries are dropped so a trailing comma in the Vercel
// env UI doesn't produce an address the mail adapter rejects.
function recipients(): string[] {
  return (process.env.NWAC_BATTERY_ALERT_RECIPIENTS ?? '')
    .split(',')
    .map((address) => address.trim())
    .filter(Boolean)
}

// Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. payload.auth() is no
// use here -- a cron has no user session.
function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return process.env.NODE_ENV !== 'production'
  return request.headers.get('authorization') === `Bearer ${secret}`
}

const isUnhealthy = (station: StationBattery) =>
  station.status === 'low' || station.status === 'high'

/**
 * Stations muted by a previous alert. A station stays muted until a forecaster
 * re-checks "Alerting" in the admin, which is how they signal it has been
 * fixed: a battery reading healthy again doesn't mean anyone has been up the
 * mountain to look at it.
 */
async function mutedStids(payload: BasePayload): Promise<Set<string>> {
  const { docs } = await payload.find({
    collection: 'stationAlerts',
    where: { alerting: { equals: false } },
    limit: 1000,
    depth: 0,
  })
  return new Set(docs.map((doc) => doc.stid))
}

/** Record the alert and mute the station so the next run stays quiet. */
async function mute(payload: BasePayload, station: StationBattery, tenant: number) {
  const existing = await payload.find({
    collection: 'stationAlerts',
    where: { stid: { equals: station.stid } },
    limit: 1,
    depth: 0,
  })
  const data = {
    stid: station.stid,
    stationName: station.name,
    alerting: false,
    lastVoltage: station.voltage,
    lastAlertedAt: new Date().toISOString(),
    tenant,
  }
  if (existing.docs[0]) {
    await payload.update({ collection: 'stationAlerts', id: existing.docs[0].id, data })
  } else {
    await payload.create({ collection: 'stationAlerts', data })
  }
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await getPayload({ config: configPromise })

  let stations: StationBattery[]
  try {
    stations = await scanBatteries(BATTERY_THRESHOLDS)
  } catch (error) {
    payload.logger.error({ err: error }, 'battery alert scan failed')
    return NextResponse.json({ error: 'Scan failed' }, { status: 502 })
  }

  const muted = await mutedStids(payload)
  const alerting = stations.filter((s) => isUnhealthy(s) && !muted.has(s.stid))
  const to = recipients()

  let emailed = false
  if (alerting.length > 0 && to.length > 0) {
    try {
      const email = await generateBatteryAlertEmail({
        stations: alerting,
        low: BATTERY_THRESHOLDS.low,
        high: BATTERY_THRESHOLDS.high,
      })
      await sendEmail({ to, ...email })
      emailed = true
    } catch (error) {
      // Return before muting. A station nobody was actually told about has to
      // stay un-muted so the next run tries again.
      payload.logger.error({ err: error }, 'battery alert email failed')
      return NextResponse.json({ checked: stations.length, emailed: false }, { status: 502 })
    }

    const { docs: tenants } = await payload.find({
      collection: 'tenants',
      where: { slug: { equals: STATIONS_TENANT_SLUG } },
      limit: 1,
      depth: 0,
    })
    const tenant = tenants[0]?.id

    if (tenant) {
      for (const station of alerting) await mute(payload, station, tenant)
    } else {
      payload.logger.error({ slug: STATIONS_TENANT_SLUG }, 'tenant not found; stations not muted')
    }
  }

  return NextResponse.json({
    checked: stations.length,
    alerted: alerting.map((s) => ({
      stid: s.stid,
      name: s.name,
      voltage: s.voltage,
      status: s.status,
    })),
    muted: muted.size,
    emailed,
  })
}
