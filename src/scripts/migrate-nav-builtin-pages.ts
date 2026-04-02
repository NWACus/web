/**
 * One-time migration script for the nav-updates PR.
 *
 * - Creates missing built-in pages: blog, events, and per-zone forecast pages
 * - Updates only forecasts.link, blog.link, events.link, and observations.items
 *   on each tenant's navigation record, leaving all other nav data untouched
 *
 * Uses direct SQL to bypass Payload's document-level validation, which would
 * otherwise fail on pre-existing invalid fields in other tabs (e.g. broken
 * page references in support/education items).
 */

import { getActiveForecastZones, getAvalancheCenterPlatforms } from '@/services/nac/nac'
import configPromise from '@payload-config'
import { sql } from '@payloadcms/db-sqlite'
import { randomUUID } from 'crypto'
import { getPayload } from 'payload'

const payload = await getPayload({ config: configPromise })

const db = payload.db.drizzle

const tenants = await payload.find({ collection: 'tenants', limit: 100, depth: 0 })

for (const tenant of tenants.docs) {
  payload.logger.info(`Processing tenant: ${tenant.slug}`)

  // --- Built-in pages ---
  const [zones, platforms] = await Promise.all([
    getActiveForecastZones(tenant.slug).then((z) =>
      z.sort((a, b) => (a.zone.rank ?? Infinity) - (b.zone.rank ?? Infinity)),
    ),
    getAvalancheCenterPlatforms(tenant.slug),
  ])

  const pagesToEnsure: { title: string; url: string }[] =
    zones.length === 1
      ? [{ title: 'Avalanche Forecast', url: `/forecasts/avalanche/${zones[0].slug}` }]
      : [
          { title: 'All Forecasts', url: '/forecasts/avalanche' },
          ...zones.map(({ zone, slug }) => ({
            title: zone.name,
            url: `/forecasts/avalanche/${slug}`,
          })),
        ]

  pagesToEnsure.push(
    { title: 'Weather Stations', url: '/weather/stations/map' },
    { title: 'Recent Observations', url: '/observations' },
    { title: 'Submit Observations', url: '/observations/submit' },
    { title: 'Blog', url: '/blog' },
    { title: 'Events', url: '/events' },
  )

  if (platforms.weather) {
    pagesToEnsure.push({ title: 'Mountain Weather', url: '/weather/forecast' })
  }

  const allExisting = await payload.find({
    collection: 'builtInPages',
    where: { tenant: { equals: tenant.id } },
    limit: 1000,
    depth: 0,
  })
  const pageByUrl: Record<string, number> = {}
  for (const page of allExisting.docs) {
    pageByUrl[page.url] = page.id
  }

  for (const { title, url } of pagesToEnsure) {
    if (pageByUrl[url]) {
      payload.logger.info(`  Built-in page already exists: ${url}`)
    } else {
      const created = await payload.create({
        collection: 'builtInPages',
        data: { tenant: tenant.id, title, url, isInNav: true },
        context: { disableRevalidate: true },
      })
      payload.logger.info(`  Created built-in page: ${url}`)
      pageByUrl[url] = created.id
    }
  }

  // --- Navigation ---

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

  const forecastLinkLabel = zones.length === 1 ? 'Avalanche Forecast' : 'All Forecasts'
  const forecastLinkPageId =
    zones.length === 1
      ? pageByUrl[`/forecasts/avalanche/${zones[0].slug}`]
      : pageByUrl['/forecasts/avalanche']

  // Update link label/type columns on the navigations row
  await db.run(sql`
    UPDATE navigations SET
      forecasts_link_type = 'internal',
      forecasts_link_label = ${forecastLinkLabel},
      blog_link_type = 'internal',
      blog_link_label = 'Blog',
      events_link_type = 'internal',
      events_link_label = 'Events'
    WHERE id = ${navId}
  `)

  // Clear old rels for the paths we're replacing
  await db.run(sql`
    DELETE FROM navigations_rels
    WHERE parent_id = ${navId}
      AND (
        path IN ('forecasts.link.reference', 'blog.link.reference', 'events.link.reference')
        OR path LIKE 'forecasts.items.%.link.reference'
        OR path LIKE 'observations.items.%.link.reference'
      )
  `)

  // Insert top-level link rels
  await db.run(
    sql`INSERT INTO navigations_rels ("order", parent_id, path, built_in_pages_id) VALUES (1, ${navId}, 'forecasts.link.reference', ${forecastLinkPageId})`,
  )
  await db.run(
    sql`INSERT INTO navigations_rels ("order", parent_id, path, built_in_pages_id) VALUES (1, ${navId}, 'blog.link.reference', ${pageByUrl['/blog']})`,
  )
  await db.run(
    sql`INSERT INTO navigations_rels ("order", parent_id, path, built_in_pages_id) VALUES (1, ${navId}, 'events.link.reference', ${pageByUrl['/events']})`,
  )

  // Replace forecasts items
  await db.run(sql`DELETE FROM navigations_forecasts_items WHERE _parent_id = ${navId}`)
  if (zones.length > 1) {
    for (let i = 0; i < zones.length; i++) {
      const { zone, slug } = zones[i]
      await db.run(sql`
        INSERT INTO navigations_forecasts_items (_order, _parent_id, id, link_type, link_label)
        VALUES (${i + 1}, ${navId}, ${randomUUID()}, 'internal', ${zone.name})
      `)
      await db.run(sql`
        INSERT INTO navigations_rels ("order", parent_id, path, built_in_pages_id)
        VALUES (1, ${navId}, ${'forecasts.items.' + i + '.link.reference'}, ${pageByUrl[`/forecasts/avalanche/${slug}`]})
      `)
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
    } else {
      payload.logger.warn(
        `  No built-in page found for ${url}, observations item will have no reference`,
      )
    }
  }

  payload.logger.info(`  Navigation updated for ${tenant.slug}`)
}

payload.logger.info('Done.')
payload.logger.info(
  'NOTE: Next.js navigation cache is NOT automatically cleared by this script. ' +
    'Go to Admin → Diagnostics → Revalidate Cache after running to reflect changes on the frontend.',
)
process.exit(0)
