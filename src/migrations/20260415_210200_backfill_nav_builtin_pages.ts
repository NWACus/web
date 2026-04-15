import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'
import { randomUUID } from 'crypto'

/**
 * Backfill built-in pages and navigation references for the auto-nav-items
 * conversion.
 *
 * - Creates missing built-in pages: blog, events, weather stations, mountain
 *   weather, observations, and per-zone forecast pages
 * - Updates only forecasts.link, blog.link, events.link, and observations.items
 *   on each tenant's navigation record, leaving all other nav data untouched
 *
 * Uses raw SQL for navigation updates to bypass Payload's document-level
 * validation, which would otherwise fail on pre-existing invalid fields in
 * other tabs (e.g. broken page references in support/education items).
 *
 * If the NAC API is unreachable for a tenant, that tenant's forecasts portion
 * is skipped (a warning is logged) so the deploy doesn't block. The affected
 * nav can be repopulated by re-saving that tenant's navigation in the admin.
 *
 * This migration does not import from app code (e.g. @/services/nac) so it
 * stays stable if service modules are refactored in the future.
 */

const NAC_HOST = process.env.NAC_HOST || 'https://api.avalanche.org'

type ActiveNacZone = {
  name: string
  url: string
  status: 'active'
  rank: number | null
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isActiveNacZone = (value: unknown): value is ActiveNacZone => {
  if (!isRecord(value)) return false
  return (
    value.status === 'active' &&
    typeof value.name === 'string' &&
    typeof value.url === 'string' &&
    (value.rank === null || typeof value.rank === 'number')
  )
}

const fetchActiveZones = async (centerSlug: string): Promise<{ name: string; slug: string }[]> => {
  // dvac shares NWAC's forecast data
  const slug = centerSlug === 'dvac' ? 'nwac' : centerSlug
  const res = await fetch(`${NAC_HOST}/v2/public/avalanche-center/${slug.toUpperCase()}`)
  if (!res.ok) throw new Error(`NAC fetch failed: ${res.status}`)
  const data: unknown = await res.json()
  if (!isRecord(data)) return []
  if (!Array.isArray(data.zones)) return []
  const active = data.zones
    .filter(isActiveNacZone)
    .sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity))
  return active.flatMap((zone) => {
    const zoneSlug = zone.url.split('/').filter(Boolean).pop()
    if (!zoneSlug) return []
    return [{ name: zone.name, slug: zoneSlug }]
  })
}

export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  const tenants = await payload.find({ collection: 'tenants', limit: 100, depth: 0 })

  for (const tenant of tenants.docs) {
    payload.logger.info(`Backfilling nav for tenant: ${tenant.slug}`)

    let zones: { name: string; slug: string }[] = []
    let nacAvailable = true

    try {
      zones = await fetchActiveZones(tenant.slug)
    } catch (err) {
      payload.logger.warn(
        { err, tenant: tenant.slug },
        `  NAC API unavailable for ${tenant.slug}; skipping forecasts backfill. Re-save the navigation in the admin for this tenant to repopulate.`,
      )
      nacAvailable = false
    }

    const pagesToEnsure: { title: string; url: string }[] = []

    if (nacAvailable) {
      if (zones.length === 1) {
        pagesToEnsure.push({
          title: 'Avalanche Forecast',
          url: `/forecasts/avalanche/${zones[0].slug}`,
        })
      } else if (zones.length > 1) {
        pagesToEnsure.push({ title: 'All Forecasts', url: '/forecasts/avalanche' })
        for (const { name, slug } of zones) {
          pagesToEnsure.push({ title: name, url: `/forecasts/avalanche/${slug}` })
        }
      }
    }

    pagesToEnsure.push(
      { title: 'Weather Stations', url: '/weather/stations/map' },
      { title: 'Mountain Weather', url: '/weather/forecast' },
      { title: 'Recent Observations', url: '/observations' },
      { title: 'Submit Observations', url: '/observations/submit' },
      { title: 'Blog', url: '/blog' },
      { title: 'Events', url: '/events' },
    )

    const allExisting = await payload.find({
      collection: 'builtInPages',
      where: { tenant: { equals: tenant.id } },
      limit: 1000,
      depth: 0,
    })
    const pageByUrl: Record<string, number | string> = {}
    for (const page of allExisting.docs) {
      pageByUrl[page.url] = page.id
    }

    for (const { title, url } of pagesToEnsure) {
      if (pageByUrl[url]) continue
      const created = await payload.create({
        collection: 'builtInPages',
        data: { tenant: tenant.id, title, url },
        context: { disableRevalidate: true },
      })
      pageByUrl[url] = created.id
    }

    const navResult = await payload.find({
      collection: 'navigations',
      where: { tenant: { equals: tenant.id } },
      limit: 1,
      depth: 0,
    })

    if (navResult.docs.length === 0) {
      payload.logger.warn(`  No navigation record found for tenant ${tenant.slug}, skipping`)
      continue
    }

    const navId = navResult.docs[0].id

    await db.run(sql`
      UPDATE navigations SET
        blog_link_type = 'internal',
        blog_link_label = 'Blog',
        events_link_type = 'internal',
        events_link_label = 'Events'
      WHERE id = ${navId}
    `)

    // Clear old rels for blog/events/observations
    await db.run(sql`
      DELETE FROM navigations_rels
      WHERE parent_id = ${navId}
        AND (
          path IN ('blog.link.reference', 'events.link.reference')
          OR path LIKE 'observations.items.%.link.reference'
        )
    `)

    await db.run(
      sql`INSERT INTO navigations_rels ("order", parent_id, path, built_in_pages_id) VALUES (1, ${navId}, 'blog.link.reference', ${pageByUrl['/blog']})`,
    )
    await db.run(
      sql`INSERT INTO navigations_rels ("order", parent_id, path, built_in_pages_id) VALUES (1, ${navId}, 'events.link.reference', ${pageByUrl['/events']})`,
    )

    if (nacAvailable) {
      const forecastLinkLabel = zones.length === 1 ? 'Avalanche Forecast' : 'All Forecasts'
      const forecastLinkPageId =
        zones.length === 1
          ? pageByUrl[`/forecasts/avalanche/${zones[0].slug}`]
          : pageByUrl['/forecasts/avalanche']

      await db.run(sql`
        UPDATE navigations SET
          forecasts_link_type = 'internal',
          forecasts_link_label = ${forecastLinkLabel}
        WHERE id = ${navId}
      `)

      await db.run(sql`
        DELETE FROM navigations_rels
        WHERE parent_id = ${navId}
          AND (
            path = 'forecasts.link.reference'
            OR path LIKE 'forecasts.items.%.link.reference'
          )
      `)

      if (forecastLinkPageId) {
        await db.run(
          sql`INSERT INTO navigations_rels ("order", parent_id, path, built_in_pages_id) VALUES (1, ${navId}, 'forecasts.link.reference', ${forecastLinkPageId})`,
        )
      }

      // Replace forecasts items
      await db.run(sql`DELETE FROM navigations_forecasts_items WHERE _parent_id = ${navId}`)
      if (zones.length > 1) {
        for (let i = 0; i < zones.length; i++) {
          const { name, slug } = zones[i]
          await db.run(sql`
            INSERT INTO navigations_forecasts_items (_order, _parent_id, id, link_type, link_label)
            VALUES (${i + 1}, ${navId}, ${randomUUID()}, 'internal', ${name})
          `)
          await db.run(sql`
            INSERT INTO navigations_rels ("order", parent_id, path, built_in_pages_id)
            VALUES (1, ${navId}, ${'forecasts.items.' + i + '.link.reference'}, ${pageByUrl[`/forecasts/avalanche/${slug}`]})
          `)
        }
      }
    }

    // Replace observations items
    await db.run(sql`DELETE FROM navigations_observations_items WHERE _parent_id = ${navId}`)
    const obsItems = [
      { label: 'Recent Observations', url: '/observations' },
      { label: 'Submit Observations', url: '/observations/submit' },
    ]
    for (let i = 0; i < obsItems.length; i++) {
      const { label, url } = obsItems[i]
      await db.run(sql`
        INSERT INTO navigations_observations_items (_order, _parent_id, id, link_type, link_label)
        VALUES (${i + 1}, ${navId}, ${randomUUID()}, 'internal', ${label})
      `)
      if (pageByUrl[url]) {
        await db.run(sql`
          INSERT INTO navigations_rels ("order", parent_id, path, built_in_pages_id)
          VALUES (1, ${navId}, ${'observations.items.' + i + '.link.reference'}, ${pageByUrl[url]})
        `)
      }
    }

    payload.logger.info(`  Backfilled nav for ${tenant.slug}`)
  }
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  // No-op — backfilled data will remain. The schema rollback in the prior
  // migration handles dropping the link columns; data rollback isn't useful.
  payload.logger.info('No rollback for nav-builtin-pages backfill')
}
