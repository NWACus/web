import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'
import { randomUUID } from 'crypto'

/**
 * Adds an NWAC-only "Weather Data" item to the Weather nav dropdown, linking to
 * the new /weather/stations index, positioned right after "Weather Stations"
 * (the map). No-op for other tenants and if the item already exists.
 *
 * Uses raw SQL for the navigation update to bypass Payload's document-level
 * validation, which can fail on pre-existing invalid fields in other nav tabs.
 */

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  const result = await db.run(sql`
    SELECT t.id AS tenant_id, n.id AS nav_id
    FROM tenants t
    JOIN navigations n ON n.tenant_id = t.id
    WHERE t.slug = 'nwac'
    LIMIT 1
  `)
  const row = result.rows[0]
  if (!isRecord(row) || typeof row.tenant_id !== 'number' || typeof row.nav_id !== 'number') {
    payload.logger.info('No nwac tenant/navigation found; skipping Weather Data nav backfill')
    return
  }
  const tenantId = row.tenant_id
  const navId = row.nav_id

  // Ensure the built-in page (link target) exists.
  const existing = await payload.find({
    collection: 'builtInPages',
    where: { tenant: { equals: tenantId }, url: { equals: '/weather/stations' } },
    limit: 1,
    depth: 0,
  })
  const pageId =
    existing.docs.length > 0
      ? existing.docs[0].id
      : (
          await payload.create({
            collection: 'builtInPages',
            data: { tenant: tenantId, title: 'Weather Data', url: '/weather/stations' },
            context: { disableRevalidate: true },
          })
        ).id

  // Idempotency: bail if a weather nav item already references this page.
  const already = await db.run(sql`
    SELECT 1 FROM navigations_rels
    WHERE parent_id = ${navId}
      AND path LIKE 'weather.items.%.link.reference'
      AND built_in_pages_id = ${pageId}
    LIMIT 1
  `)
  if (already.rows.length > 0) {
    payload.logger.info('Weather Data nav item already present for nwac; skipping')
    return
  }

  // Shift existing weather items at position >= 1 (i.e. everything after the
  // "Weather Stations" map item) down by one, highest _order first to avoid
  // collisions, updating both the item order and its rel-path index.
  const items = await db.run(sql`
    SELECT _order FROM navigations_weather_items WHERE _parent_id = ${navId} ORDER BY _order DESC
  `)
  for (const item of items.rows) {
    if (!isRecord(item) || typeof item._order !== 'number' || item._order < 2) continue
    const oldOrder = item._order
    const newOrder = oldOrder + 1
    await db.run(sql`
      UPDATE navigations_weather_items SET _order = ${newOrder}
      WHERE _parent_id = ${navId} AND _order = ${oldOrder}
    `)
    await db.run(sql`
      UPDATE navigations_rels
      SET path = ${`weather.items.${newOrder - 1}.link.reference`}
      WHERE parent_id = ${navId} AND path = ${`weather.items.${oldOrder - 1}.link.reference`}
    `)
  }

  // Insert "Weather Data" at position 1 (_order 2).
  await db.run(sql`
    INSERT INTO navigations_weather_items (_order, _parent_id, id, link_type, link_label, link_new_tab)
    VALUES (2, ${navId}, ${randomUUID()}, 'internal', 'Weather Data', 1)
  `)
  await db.run(sql`
    INSERT INTO navigations_rels ("order", parent_id, path, built_in_pages_id)
    VALUES (1, ${navId}, 'weather.items.1.link.reference', ${pageId})
  `)

  // Clear stale draft versions so Payload regenerates from the main tables.
  await db.run(sql`DELETE FROM _navigations_v WHERE parent_id = ${navId}`)

  payload.logger.info('Added NWAC Weather Data nav item')
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  // No-op — the added nav item and built-in page are left in place.
  payload.logger.info('No rollback for NWAC Weather Data nav item')
}
