import { NWAC_STATION_REGIONS, NWAC_WEATHER_STATION_GROUPS } from '@/constants/weatherStations'
import { syncStations } from '@/services/snowobs/syncStations'
import { TABLE_COLUMN_VARIABLES, type TableColumnVariable } from '@/services/snowobs/tableColumns'
import config from '@payload-config'
import { getPayload } from 'payload'

/**
 * Seed the weather station collections for a local database.
 *
 * The migration that seeds these on a deployed environment is a no-op locally:
 * it runs before `/next/seed` has created any tenant, finds no `nwac`, and
 * returns. Locally the schema is pushed rather than migrated anyway, so this
 * script is the way to get the data. Run it after `pnpm seed`.
 *
 * Idempotent -- existing regions, stations and groups are left alone, so it is
 * safe to re-run after adding a group to the constants.
 */
const TENANT_SLUG = 'nwac'
const SOURCE = 'nwac'

const isTableVariable = (value: string): value is TableColumnVariable =>
  TABLE_COLUMN_VARIABLES.some((variable) => variable === value)

const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const payload = await getPayload({ config })

const { docs: tenants } = await payload.find({
  collection: 'tenants',
  where: { slug: { equals: TENANT_SLUG } },
  limit: 1,
})
const tenant = tenants[0]
if (!tenant) {
  payload.logger.error(`No ${TENANT_SLUG} tenant. Run \`pnpm seed\` first.`)
  process.exit(1)
}

const token = process.env.SNOWOBS_TOKEN
if (!token) {
  payload.logger.error('SNOWOBS_TOKEN is not set; stations cannot be fetched.')
  process.exit(1)
}

// The SnowObs config, so the sync button and the hourly cron both work locally.
const { docs: settings } = await payload.find({
  collection: 'settings',
  where: { tenant: { equals: tenant.id } },
  limit: 1,
})
if (settings[0]) {
  await payload.update({
    collection: 'settings',
    id: settings[0].id,
    context: { disableRevalidate: true },
    data: { snowobs: { source: SOURCE, token, weatherPagesEnabled: true } },
  })
}

// ---- regions -------------------------------------------------------------
const { docs: existingRegions } = await payload.find({
  collection: 'stationRegions',
  where: { tenant: { equals: tenant.id } },
  limit: 100,
  depth: 0,
})
const regionId = new Map(existingRegions.map((region) => [region.slug, region.id]))

for (const [index, name] of NWAC_STATION_REGIONS.entries()) {
  const slug = slugify(name)
  if (regionId.has(slug)) continue
  const doc = await payload.create({
    collection: 'stationRegions',
    data: { name, slug, rank: index + 1, tenant: tenant.id },
  })
  regionId.set(slug, doc.id)
}

// ---- stations ------------------------------------------------------------
const synced = await syncStations(payload, {
  tenantId: tenant.id,
  tenantSlug: tenant.slug,
  source: SOURCE,
  token,
})

const { docs: stationDocs } = await payload.find({
  collection: 'stations',
  where: { tenant: { equals: tenant.id } },
  limit: 1000,
  depth: 0,
})
const stationId = new Map(stationDocs.map((station) => [station.stid, station.id]))

// ---- groups --------------------------------------------------------------
const { docs: existingGroups } = await payload.find({
  collection: 'stationGroups',
  where: { tenant: { equals: tenant.id } },
  limit: 200,
  depth: 0,
})
const seen = new Set(existingGroups.map((group) => group.slug))

let created = 0
for (const group of NWAC_WEATHER_STATION_GROUPS) {
  if (seen.has(group.slug)) continue

  const region = regionId.get(slugify(group.region))
  if (!region) throw new Error(`Region ${group.region} missing for ${group.slug}`)

  // One row per reading, naming the loggers reporting it, in the order the
  // legacy columns appeared.
  const rows: { variable: TableColumnVariable; stids: string[] }[] = []
  for (const [stid, variable] of group.columns) {
    if (!isTableVariable(variable)) throw new Error(`Unknown variable ${variable} in ${group.slug}`)
    let row = rows.find((candidate) => candidate.variable === variable)
    if (!row) {
      row = { variable, stids: [] }
      rows.push(row)
    }
    if (!row.stids.includes(stid)) row.stids.push(stid)
  }

  const id = (stid: string) => {
    const value = stationId.get(stid)
    if (!value) throw new Error(`Station ${stid} missing for ${group.slug}`)
    return value
  }

  await payload.create({
    collection: 'stationGroups',
    data: {
      slug: group.slug,
      legacySlug: group.legacySlug,
      displayName: group.displayName,
      archived: Boolean(group.archived),
      region,
      stations: group.stids.map(id),
      tableColumns: rows.map((row) => ({ variable: row.variable, stations: row.stids.map(id) })),
      tenant: tenant.id,
    },
  })
  created++
}

payload.logger.info(
  `Weather seed: ${regionId.size} regions, stations ${synced.created} added / ${synced.updated} updated / ${synced.unchanged} unchanged, ${created} groups created (${seen.size} already present).`,
)
process.exit(0)
