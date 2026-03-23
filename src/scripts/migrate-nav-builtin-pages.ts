/**
 * One-time migration script for the nav-updates PR.
 *
 * - Creates missing built-in pages: blog, events, and per-zone forecast pages
 * - Updates only forecasts.link, blog.link, events.link, and observations.items
 *   on each tenant's navigation record, leaving all other nav data untouched
 */

import { getActiveForecastZones } from '@/services/nac/nac'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

const payload = await getPayload({ config: configPromise })

const tenants = await payload.find({ collection: 'tenants', limit: 100, depth: 0 })

for (const tenant of tenants.docs) {
  payload.logger.info(`Processing tenant: ${tenant.slug}`)

  // --- Built-in pages ---
  const zones = (await getActiveForecastZones(tenant.slug)).sort(
    (a, b) => (a.zone.rank ?? Infinity) - (b.zone.rank ?? Infinity),
  )

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

  pagesToEnsure.push({ title: 'Blog', url: '/blog' }, { title: 'Events', url: '/events' })

  // Fetch all existing built-in pages for this tenant up front
  const allExisting = await payload.find({
    collection: 'builtInPages',
    where: { tenant: { equals: tenant.id } },
    limit: 1000,
    depth: 0,
  })
  const builtInPageByUrl: Record<string, number> = {}
  for (const page of allExisting.docs) {
    builtInPageByUrl[page.url] = page.id
  }

  // Create any missing pages
  for (const { title, url } of pagesToEnsure) {
    if (builtInPageByUrl[url]) {
      payload.logger.info(`  Built-in page already exists: ${url}`)
    } else {
      const created = await payload.create({
        collection: 'builtInPages',
        data: { tenant: tenant.id, title, url },
        context: { disableRevalidate: true },
      })
      payload.logger.info(`  Created built-in page: ${url}`)
      builtInPageByUrl[url] = created.id
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

  const nav = navResult.docs[0]

  const forecastLink =
    zones.length === 1
      ? {
          type: 'internal' as const,
          reference: {
            relationTo: 'builtInPages' as const,
            value: builtInPageByUrl[`/forecasts/avalanche/${zones[0].slug}`],
          },
          label: 'Avalanche Forecast',
        }
      : {
          type: 'internal' as const,
          reference: {
            relationTo: 'builtInPages' as const,
            value: builtInPageByUrl['/forecasts/avalanche'],
          },
          label: 'All Forecasts',
        }

  const forecastItems =
    zones.length === 1
      ? []
      : zones.map(({ zone, slug }) => ({
          link: {
            type: 'internal' as const,
            reference: {
              relationTo: 'builtInPages' as const,
              value: builtInPageByUrl[`/forecasts/avalanche/${slug}`],
            },
            label: zone.name,
          },
        }))

  await payload.update({
    collection: 'navigations',
    id: nav.id,
    data: {
      forecasts: {
        link: forecastLink,
        items: forecastItems,
      },
      observations: {
        items: [
          {
            link: {
              type: 'internal',
              reference: {
                relationTo: 'builtInPages',
                value: builtInPageByUrl['/observations'] ?? null,
              },
              label: 'Recent Observations',
            },
          },
          {
            link: {
              type: 'internal',
              reference: {
                relationTo: 'builtInPages',
                value: builtInPageByUrl['/observations/submit'] ?? null,
              },
              label: 'Submit Observations',
            },
          },
        ],
      },
      blog: {
        link: {
          type: 'internal',
          reference: { relationTo: 'builtInPages', value: builtInPageByUrl['/blog'] },
          label: 'Blog',
        },
      },
      events: {
        link: {
          type: 'internal',
          reference: { relationTo: 'builtInPages', value: builtInPageByUrl['/events'] },
          label: 'Events',
        },
      },
    },
    context: { disableRevalidate: true },
  })

  payload.logger.info(`  Navigation updated for ${tenant.slug}`)
}

payload.logger.info('Done.')
process.exit(0)
