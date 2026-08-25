// One-shot MWF archive importer: walks the legacy nwac.us zone API by date
// range, stitches each legacy forecast's zone responses into the envelope,
// and imports it via Payload's local API with provenance marked
// (source: 'django-import', context.mwfImport bypasses the draft-only create
// guard). Idempotent: a slot that already has an imported row is skipped, so
// the walk can resume after an interruption.
//
//   pnpm payload run ./src/scripts/import-mwf-archive.ts -- \
//     --from 2026-01-01 --to 2026-02-01 [--tenant nwac] [--base https://nwac.us]
//
// Each date is probed twice (morning + evening published_datetime) so both
// issuances are captured; responses are grouped by the legacy forecast id.
import {
  importZones,
  pointCodeByName,
  stitchLegacyForecast,
  type LegacyObjects,
} from '@/services/products/mwf/legacyImport'
import { MWF_STRUCTURE } from '@/utilities/mwf/structure'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

function arg(name: string, fallback?: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`)
  if (index >= 0 && process.argv[index + 1]) return process.argv[index + 1]
  return fallback
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function* dateRange(from: string, to: string): Generator<string> {
  const cursor = new Date(`${from}T00:00:00Z`)
  const end = new Date(`${to}T00:00:00Z`)
  while (cursor <= end) {
    yield cursor.toISOString().slice(0, 10)
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
}

async function fetchZoneObjects(
  base: string,
  nacZoneId: string,
  publishedDatetime: string,
): Promise<LegacyObjects | null> {
  const url = `${base}/api/v1/mountain-weather-region-forecast/?zone_id=${nacZoneId}&published_datetime=${encodeURIComponent(publishedDatetime)}`
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(40_000),
  })
  if (!res.ok) return null
  const data = await res.json()
  if (!data || typeof data !== 'object' || !('objects' in data)) return null
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return data.objects as LegacyObjects
}

async function run() {
  const from = arg('from')
  const to = arg('to', from)
  const tenantSlug = arg('tenant', 'nwac')
  const base = arg('base', 'https://nwac.us')
  if (!from || !to || !DATE_RE.test(from) || !DATE_RE.test(to) || !base || !tenantSlug) {
    throw new Error(
      'usage: --from YYYY-MM-DD --to YYYY-MM-DD [--tenant nwac] [--base https://nwac.us]',
    )
  }

  const payload = await getPayload({ config: configPromise })
  const tenants = await payload.find({
    collection: 'tenants',
    where: { slug: { equals: tenantSlug } },
    limit: 1,
    depth: 0,
  })
  const tenant = tenants.docs[0]
  if (!tenant) throw new Error(`unknown tenant ${tenantSlug}`)
  const settings = await payload.find({
    collection: 'settings',
    where: { tenant: { equals: tenant.id } },
    limit: 1,
    depth: 0,
  })
  const mwfConfig = settings.docs[0]?.mwf
  if (!mwfConfig) throw new Error(`tenant ${tenantSlug} has no MWF config`)
  const zones = importZones(mwfConfig.zones ?? [])
  if (!zones.length) throw new Error('no zones with nacZoneIds configured')
  const pointMap = pointCodeByName(mwfConfig.points ?? [])
  const snapshot = { config: mwfConfig, structure: MWF_STRUCTURE }

  let imported = 0
  let skipped = 0
  let missed = 0

  for (const date of dateRange(from, to)) {
    // Two probes bracket the day: late morning catches the AM issuance,
    // late evening the PM. Responses group by the legacy forecast id.
    const probes = [`${date}T11:30:00-08:00`, `${date}T23:30:00-08:00`]
    const byLegacyId = new Map<number, Record<string, LegacyObjects>>()

    for (const probe of probes) {
      for (const zone of zones) {
        try {
          const objects = await fetchZoneObjects(base, zone.nacZoneId, probe)
          if (!objects) continue
          // Only accept forecasts anchored on the walked date — the legacy
          // API returns the newest forecast BEFORE the probe time, which may
          // belong to an earlier day.
          if (objects.mountain_weather_forecast.day1_date !== date) continue
          const group = byLegacyId.get(objects.mountain_weather_forecast.id) ?? {}
          group[zone.id] = objects
          byLegacyId.set(objects.mountain_weather_forecast.id, group)
        } catch (error) {
          payload.logger.warn(
            { err: error, date, zone: zone.id },
            'mwf archive fetch failed; continuing',
          )
        }
      }
    }

    if (!byLegacyId.size) {
      missed += 1
      continue
    }

    for (const group of byLegacyId.values()) {
      const stitched = stitchLegacyForecast(group, { pointCodeByName: pointMap })
      if (!stitched) continue
      const existing = await payload.find({
        collection: 'mwfForecasts',
        where: {
          and: [
            { tenant: { equals: tenant.id } },
            { serviceDate: { equals: stitched.serviceDate } },
            { issuance: { equals: stitched.issuance } },
            { source: { equals: 'django-import' } },
          ],
        },
        limit: 1,
        depth: 0,
      })
      if (existing.docs.length) {
        skipped += 1
        continue
      }
      const body = {
        ...stitched.body,
        meta: {
          type: stitched.issuance,
          author: stitched.authorName,
          issued: stitched.issuedAt.slice(0, 16),
          initialDate: stitched.serviceDate,
        },
      }
      await payload.create({
        collection: 'mwfForecasts',
        data: {
          tenant: tenant.id,
          status: 'published',
          issuance: stitched.issuance,
          serviceDate: stitched.serviceDate,
          issuedAt: stitched.issuedAt,
          revision: 1,
          source: 'django-import',
          body,
          publishSnapshot: snapshot,
        },
        context: { mwfImport: true },
        depth: 0,
      })
      imported += 1
      payload.logger.info(
        { date: stitched.serviceDate, issuance: stitched.issuance, legacyId: stitched.legacyId },
        'imported legacy MWF forecast',
      )
    }
  }

  payload.logger.info({ imported, skipped, missed }, 'mwf archive import complete')
}

await run()
process.exit(0)
