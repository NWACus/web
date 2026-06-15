import { hasSuperAdminPermissions } from '@/access/hasSuperAdminPermissions'
import { getSeedImageByFilename, simpleContent } from '@/endpoints/seed/utilities'
import type { BuiltInPage, Page, Tenant } from '@/payload-types'
// nac.ts imports @payload-config, which imports this collection — lazy-load
// the value imports inside function bodies to break the circular dependency.
// Type imports are erased at runtime and don't contribute to the cycle.
import type { ActiveForecastZoneWithSlug } from '@/services/nac/nac'
import { matchTimezone } from '@/utilities/timezones'
import type { Payload, PayloadHandler } from 'payload'
import type { Logger } from 'pino'

/**
 * Non-forecast built-in pages every tenant gets. Mountain Weather is not
 * listed here — it's conditionally added based on whether NAC reports the
 * center has a weather platform.
 */
export const BUILT_IN_PAGES: ReadonlyArray<{ title: string; url: string }> = [
  { title: 'Weather Stations', url: '/weather/stations/map' },
  { title: 'Recent Observations', url: '/observations' },
  { title: 'Submit Observations', url: '/observations/submit' },
  { title: 'Blog', url: '/blog' },
  { title: 'Events', url: '/events' },
]

/**
 * Blank pages every tenant gets. Titles are placeholders that the tenant
 * admin is expected to edit; slugs are referenced by the default navigation.
 */
export const PAGES_TO_PROVISION: ReadonlyArray<{ slug: string; title: string }> = [
  { slug: 'weather-tools', title: 'Weather Tools' },
  { slug: 'learn', title: 'Learn' },
  { slug: 'field-classes', title: 'Field Classes' },
  { slug: 'avalanche-awareness-classes', title: 'Avalanche Awareness Classes' },
  { slug: 'courses-by-external-providers', title: 'Courses by External Providers' },
  { slug: 'workshops', title: 'Workshops' },
  { slug: 'request-a-class', title: 'Request a Class' },
  { slug: 'scholarships', title: 'Scholarships' },
  { slug: 'mentorship', title: 'Mentorship' },
  { slug: 'beacon-parks', title: 'Beacon Parks' },
  { slug: 'about-us', title: 'About Us' },
  { slug: 'agency-partners', title: 'Agency Partners' },
  { slug: 'who-we-are', title: 'Who We Are' },
  { slug: 'annual-report-minutes', title: 'Annual Reports & Minutes' },
  { slug: 'employment', title: 'Employment' },
  { slug: 'donate-membership', title: 'Donate / Membership' },
  { slug: 'workplace-giving', title: 'Workplace Giving' },
  { slug: 'other-ways-to-give', title: 'Other Ways to Give' },
  { slug: 'corporate-sponsorship', title: 'Corporate Sponsorship' },
  { slug: 'volunteer', title: 'Volunteer' },
  { slug: 'local-accident-reports', title: 'Local Accident Reports' },
  { slug: 'avalanche-accident-statistics', title: 'Avalanche Accident Statistics' },
  { slug: 'us-avalanche-accidents', title: 'US Avalanche Accidents' },
  { slug: 'grief-and-loss-resources', title: 'Grief and Loss Resources' },
  { slug: 'avalanche-accident-map', title: 'Avalanche Accident Map' },
]

/**
 * Queries AFP for forecast zones and returns zone-aware forecast built-in
 * pages plus the static non-forecast list (with Mountain Weather conditionally
 * included based on NAC platforms).
 */
export async function resolveBuiltInPages(
  tenantSlug: string,
  log: Logger,
): Promise<{
  forecastPages: Array<{ title: string; url: string }>
  nonForecastPages: Array<{ title: string; url: string }>
}> {
  // Lazy-loaded to break the circular import with @payload-config
  const { getActiveForecastZones, getAvalancheCenterPlatforms } = await import('@/services/nac/nac')

  let forecastZones: ActiveForecastZoneWithSlug[] = []
  try {
    forecastZones = await getActiveForecastZones(tenantSlug)
    if (forecastZones.length === 0) {
      log.warn(
        `[${tenantSlug}] No forecast zones found from AFP. Creating default "All Forecasts" page.`,
      )
    } else {
      log.info(`[${tenantSlug}] Found ${forecastZones.length} forecast zone(s) from AFP`)
    }
  } catch (err) {
    log.warn(
      `[${tenantSlug}] Failed to query AFP for forecast zones: ${err instanceof Error ? err.message : 'Unknown error'}. Creating default "All Forecasts" page.`,
    )
  }

  // Sort by rank so consumers can iterate in display order
  const sorted = [...forecastZones].sort(
    (a, b) => (a.zone.rank ?? Infinity) - (b.zone.rank ?? Infinity),
  )

  const forecastPages =
    sorted.length === 1
      ? [
          {
            title: 'Avalanche Forecast',
            url: `/forecasts/avalanche/${sorted[0].slug}`,
          },
        ]
      : [
          { title: 'All Forecasts', url: '/forecasts/avalanche' },
          ...sorted.map(({ zone, slug }) => ({
            title: zone.name,
            url: `/forecasts/avalanche/${slug}`,
          })),
        ]

  const nonForecastPages: Array<{ title: string; url: string }> = [...BUILT_IN_PAGES]

  // Add Mountain Weather only if center has weather forecasts in NAC
  try {
    const { weather } = await getAvalancheCenterPlatforms(tenantSlug)
    if (weather) {
      nonForecastPages.push({ title: 'Mountain Weather', url: '/weather/forecast' })
    }
  } catch {
    log.warn(`[${tenantSlug}] Failed to query NAC platforms. Excluding Mountain Weather.`)
  }

  return { forecastPages, nonForecastPages }
}

/**
 * Creates a new tenant and provisions it with all default data.
 *
 * POST /api/tenants/provision
 * Body: { name: string, slug: string}
 * Requires super admin permissions.
 *
 * This replaces the manual workflow of creating a tenant then separately
 * setting up built-in pages, copying template pages, creating a home page,
 * and configuring navigation.
 */
export const provisionTenant: PayloadHandler = async (req) => {
  const { payload, user } = req

  if (!user) {
    return Response.json({ error: 'Authentication required' }, { status: 401 })
  }

  const isSuperAdmin = await hasSuperAdminPermissions({
    req,
    doc: undefined,
    data: undefined,
    siblingData: undefined,
  })

  if (!isSuperAdmin) {
    return Response.json({ error: 'Super admin access required' }, { status: 403 })
  }

  const body = await req.json?.()
  if (!body?.name || !body?.slug) {
    return Response.json({ error: 'name and slug are required' }, { status: 400 })
  }

  try {
    // Create the tenant. Initial provisioning is 'not_started'; the provision()
    // call below overwrites with the actual outcome when it completes.
    const tenant = await payload.create({
      collection: 'tenants',
      data: {
        name: body.name,
        slug: body.slug,
        provisioning: {
          status: 'not_started',
          lastRunAt: new Date().toISOString(),
        },
      },
    })

    payload.logger.info(`Created tenant: ${tenant.name} (${tenant.slug})`)

    // Provision all default data
    const result = await provision(payload, tenant)
    return Response.json(result, { status: 201 })
  } catch (error) {
    payload.logger.error(
      `Error creating/provisioning tenant: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to create tenant' },
      { status: 500 },
    )
  }
}

/**
 * Provisions a tenant with all default data:
 * 1. Website Settings with placeholder brand assets (logo, icon, banner)
 * 2. Query AFP for forecast zones (single vs multi-zone detection)
 * 3. Built-in pages (zone-aware forecasts + static non-forecast list + optional
 *    Mountain Weather based on NAC platforms)
 * 4. Blank pages for every entry in PAGES_TO_PROVISION
 * 5. Home page with default content
 * 6. Navigation linked to the new pages and built-in pages (zone-aware forecasts)
 *
 * Idempotent - checks for existing data before creating.
 */

export type ProvisioningFailed = NonNullable<NonNullable<Tenant['provisioning']>['failed']>

// A run that's been in_progress longer than this is treated as crashed; the
// next caller is allowed to take over.
export const STALE_IN_PROGRESS_MS = 5 * 60 * 1000

const errorMessage = (err: unknown): string =>
  err instanceof Error ? err.message : 'Unknown error'

export async function provision(payload: Payload, tenant: Tenant) {
  const log = payload.logger

  log.info(`Provisioning tenant: ${tenant.name} (${tenant.slug})`)

  // Acquire a per-tenant lock; take over stale runs to recover from crashes.
  const now = new Date()
  const staleCutoff = new Date(now.getTime() - STALE_IN_PROGRESS_MS).toISOString()
  const lockResult = await payload.update({
    collection: 'tenants',
    where: {
      and: [
        { id: { equals: tenant.id } },
        {
          or: [
            { 'provisioning.status': { not_equals: 'in_progress' } },
            { 'provisioning.lastRunAt': { less_than: staleCutoff } },
          ],
        },
      ],
    },
    data: {
      provisioning: {
        status: 'in_progress',
        lastRunAt: now.toISOString(),
        failed: undefined,
      },
    },
  })

  if (lockResult.docs.length === 0) {
    log.warn(`[${tenant.slug}] Skipping provision — another run is already active`)
    throw new Error(`Provisioning is already in progress for ${tenant.slug}`)
  }

  const failed: ProvisioningFailed = {}

  // 0. Sync timezone from NAC (also runs in beforeChange on create, but provision
  //    may be called independently or the NAC fetch may have failed earlier)
  if (!tenant.timezone) {
    try {
      const { getAvalancheCenterMetadata } = await import('@/services/nac/nac')
      const metadata = await getAvalancheCenterMetadata(tenant.slug)
      const timezone = matchTimezone(metadata.timezone)
      if (timezone) {
        await payload.update({
          collection: 'tenants',
          id: tenant.id,
          data: { timezone },
        })
        log.info(`[${tenant.slug}] Set timezone: ${timezone}`)
      }
    } catch (err) {
      log.warn(
        `[${tenant.slug}] Failed to sync timezone from NAC: ${err instanceof Error ? err.message : err}`,
      )
    }
  }

  // 1. Create Website Settings with placeholder brand assets
  log.info(`[${tenant.slug}] Creating website settings...`)
  const existingSettings = await payload.find({
    collection: 'settings',
    where: { tenant: { equals: tenant.id } },
    limit: 1,
  })
  let settingsCreated = false
  if (existingSettings.docs.length === 0) {
    try {
      const [logoFile, iconFile, bannerFile] = await Promise.all([
        getSeedImageByFilename('placeholder-logo.png', log),
        getSeedImageByFilename('placeholder-icon.png', log),
        getSeedImageByFilename('placeholder-banner.png', log),
      ])
      const [logo, icon, banner] = await Promise.all([
        payload.create({
          collection: 'media',
          data: { tenant: tenant.id, alt: 'logo' },
          file: logoFile,
        }),
        payload.create({
          collection: 'media',
          data: { tenant: tenant.id, alt: 'icon' },
          file: iconFile,
        }),
        payload.create({
          collection: 'media',
          data: { tenant: tenant.id, alt: 'banner' },
          file: bannerFile,
        }),
      ])
      await payload.create({
        collection: 'settings',
        data: {
          tenant: tenant.id,
          description: tenant.name,
          footerForm: { type: 'none' },
          socialMedia: {},
          logo: logo.id,
          icon: icon.id,
          banner: banner.id,
        },
      })
      settingsCreated = true
    } catch (err) {
      const message = errorMessage(err)
      log.error(`[${tenant.slug}] Failed to create website settings: ${message}`)
      failed.websiteSettings = message
    }
  } else {
    log.info(`[${tenant.slug}] Website settings already exist, skipping`)
  }

  // 2. Query AFP for forecast zones and resolve built-in pages
  const { forecastPages, nonForecastPages } = await resolveBuiltInPages(tenant.slug, log)
  const builtInPagesToCreate = [...forecastPages, ...nonForecastPages]
  log.info(`[${tenant.slug}] Creating ${builtInPagesToCreate.length} built-in pages...`)
  const existingBuiltInPages = await payload.find({
    collection: 'builtInPages',
    where: { tenant: { equals: tenant.id } },
    limit: 100,
  })
  const existingBuiltInPageUrls = new Set(existingBuiltInPages.docs.map((p) => p.url))

  const createdBuiltInPages: BuiltInPage[] = [...existingBuiltInPages.docs]
  for (const { title, url } of builtInPagesToCreate) {
    if (existingBuiltInPageUrls.has(url)) {
      log.info(`[${tenant.slug}] Built-in page "${title}" already exists, skipping`)
      continue
    }
    const created = await payload.create({
      collection: 'builtInPages',
      data: {
        tenant: tenant.id,
        title,
        url,
      },
    })
    createdBuiltInPages.push(created)
  }

  // Index built-in pages by URL for navigation linking
  const builtInPagesByUrl: Record<string, BuiltInPage> = {}
  for (const bip of createdBuiltInPages) {
    builtInPagesByUrl[bip.url] = bip
  }

  // 3. Create blank pages for every entry in PAGES_TO_PROVISION
  const createdPages: Page[] = []
  const pagesBySlug: Record<string, Page> = {}

  const existingPages = await payload.find({
    collection: 'pages',
    where: { tenant: { equals: tenant.id } },
    limit: 500,
    depth: 0,
  })
  const existingPagesBySlug = new Map(existingPages.docs.map((p) => [p.slug, p]))

  for (const { slug, title } of PAGES_TO_PROVISION) {
    const existing = existingPagesBySlug.get(slug)
    if (existing) {
      log.info(`[${tenant.slug}] Page "${title}" already exists, skipping`)
      pagesBySlug[slug] = existing
      continue
    }

    try {
      const newPage = await payload.create({
        collection: 'pages',
        data: {
          layout: [
            {
              blockType: 'content',
              backgroundColor: 'transparent',
              layout: '1_1',
              columns: [{ richText: simpleContent('') }],
            },
          ],
          tenant: tenant.id,
          title,
          slug,
          _status: 'published',
          publishedAt: new Date().toISOString(),
        },
      })
      createdPages.push(newPage)
      pagesBySlug[slug] = newPage
    } catch (err) {
      const message = errorMessage(err)
      log.error(`[${tenant.slug}] Failed to create page "${title}" (slug: ${slug}): ${message}`)
      if (!failed.pages) failed.pages = {}
      failed.pages[title] = message
    }
  }

  // Also index any pre-existing pages not in PAGES_TO_PROVISION (so the nav
  // builder can still reference them if present)
  for (const p of existingPages.docs) {
    if (!pagesBySlug[p.slug]) {
      pagesBySlug[p.slug] = p
    }
  }

  // 4. Create Home Page
  log.info(`[${tenant.slug}] Creating home page...`)
  const existingHomePage = await payload.find({
    collection: 'homePages',
    where: { tenant: { equals: tenant.id } },
    limit: 1,
  })
  let homePageCreated = false
  if (existingHomePage.docs.length === 0) {
    const aboutUsPage = pagesBySlug['about-us']
    const donatePage = pagesBySlug['donate-membership']

    const quickLinks = []
    if (aboutUsPage) {
      quickLinks.push({
        type: 'internal' as const,
        label: 'Learn More',
        reference: { relationTo: 'pages' as const, value: aboutUsPage.id },
      })
    }
    if (donatePage) {
      quickLinks.push({
        type: 'internal' as const,
        label: 'Donate',
        reference: { relationTo: 'pages' as const, value: donatePage.id },
      })
    }

    try {
      await payload.create({
        collection: 'homePages',
        data: {
          tenant: tenant.id,
          quickLinks,
          highlightedContent: {
            enabled: true,
            heading: 'Welcome to ' + tenant.name,
            backgroundColor: 'brand-700',
            columns: [
              {
                richText: simpleContent(
                  'Stay informed with the latest avalanche forecasts, mountain weather conditions, and safety information for our region.',
                ),
              },
              {
                richText: simpleContent(
                  'Our mission is to increase avalanche awareness, reduce avalanche impacts, and equip the community with essential safety education and data.',
                ),
              },
            ],
          },
          layout: [
            {
              blockType: 'eventList',
              heading: 'Upcoming Events',
              backgroundColor: 'transparent',
              eventOptions: 'dynamic',
              dynamicOpts: {
                maxEvents: 4,
              },
            },
          ],
          _status: 'published',
          publishedAt: new Date().toISOString(),
        },
      })
      homePageCreated = true
    } catch (err) {
      const message = errorMessage(err)
      log.error(`[${tenant.slug}] Failed to create home page: ${message}`)
      failed.homePage = message
    }
  } else {
    log.info(`[${tenant.slug}] Home page already exists, skipping`)
  }

  // 5. Create Navigation
  log.info(`[${tenant.slug}] Creating navigation...`)
  const existingNavigation = await payload.find({
    collection: 'navigations',
    where: { tenant: { equals: tenant.id } },
    limit: 1,
  })
  let navigationCreated = false
  if (existingNavigation.docs.length === 0) {
    // Build a nav link item, returning null if the page doesn't exist
    const navPageItem = (slug: string, label?: string) => {
      const page = pagesBySlug[slug]
      if (!page) {
        log.warn(`[${tenant.slug}] Page "${slug}" not found for navigation link, skipping`)
        return null
      }
      return {
        link: {
          type: 'internal' as const,
          reference: { value: page.id, relationTo: 'pages' as const },
          label: label || page.title,
        },
      }
    }

    const navBuiltInPageItem = (url: string, label?: string) => {
      const bip = builtInPagesByUrl[url]
      if (!bip) {
        log.warn(`[${tenant.slug}] Built-in page "${url}" not found for navigation link, skipping`)
        return null
      }
      return {
        link: {
          type: 'internal' as const,
          reference: { value: bip.id, relationTo: 'builtInPages' as const },
          label: label || bip.title,
        },
      }
    }

    // Filter out null entries from nav item arrays
    const filterNulls = <T>(items: (T | null)[]): T[] =>
      items.filter((item): item is T => item !== null)

    try {
      await payload.create({
        collection: 'navigations',
        data: {
          tenant: tenant.id,
          forecasts:
            forecastPages.length === 1
              ? {
                  options: { displayMode: 'dropdown' },
                  items: filterNulls([
                    navBuiltInPageItem(forecastPages[0].url, forecastPages[0].title),
                  ]),
                }
              : {
                  options: { displayMode: 'dropdown' },
                  items: [
                    ...filterNulls([navBuiltInPageItem('/forecasts/avalanche', 'All Forecasts')]),
                    {
                      label: 'Zones',
                      items: filterNulls(
                        forecastPages
                          .filter((p) => p.url !== '/forecasts/avalanche')
                          .map((p) => navBuiltInPageItem(p.url, p.title)),
                      ),
                    },
                  ],
                },
          observations: {
            options: { displayMode: 'dropdown' },
            items: filterNulls([
              navBuiltInPageItem('/observations', 'Recent Observations'),
              navBuiltInPageItem('/observations/submit', 'Submit Observations'),
            ]),
          },
          weather: {
            options: { displayMode: 'dropdown' },
            items: filterNulls([
              navBuiltInPageItem('/weather/stations/map', 'Weather Stations'),
              navPageItem('weather-tools'),
            ]),
          },
          education: {
            options: { displayMode: 'dropdown' },
            items: [
              ...filterNulls([navPageItem('learn')]),
              {
                label: 'Classes',
                items: filterNulls([
                  navPageItem('field-classes'),
                  navPageItem('avalanche-awareness-classes'),
                  navPageItem('courses-by-external-providers'),
                  navPageItem('workshops'),
                  navPageItem('request-a-class'),
                ]),
              },
              ...filterNulls([
                navPageItem('scholarships'),
                navPageItem('mentorship'),
                navPageItem('beacon-parks'),
              ]),
            ],
          },
          about: {
            options: { displayMode: 'dropdown' },
            items: filterNulls([
              navPageItem('about-us'),
              navPageItem('agency-partners'),
              navPageItem('who-we-are'),
              navPageItem('annual-report-minutes'),
              navPageItem('employment'),
            ]),
          },
          support: {
            options: { displayMode: 'dropdown' },
            items: filterNulls([
              navPageItem('donate-membership'),
              navPageItem('workplace-giving'),
              navPageItem('other-ways-to-give'),
              navPageItem('corporate-sponsorship'),
              navPageItem('volunteer'),
            ]),
          },
          accidents: {
            options: { displayMode: 'dropdown' },
            items: filterNulls([
              navPageItem('local-accident-reports'),
              navPageItem('avalanche-accident-statistics'),
              navPageItem('us-avalanche-accidents'),
              navPageItem('grief-and-loss-resources'),
              navPageItem('avalanche-accident-map'),
            ]),
          },
          blog: {
            options: { displayMode: 'link', enabled: true },
            link: navBuiltInPageItem('/blog', 'Blog')?.link,
          },
          events: {
            options: { displayMode: 'link', enabled: true },
            link: navBuiltInPageItem('/events', 'Events')?.link,
          },
          donate: {
            options: { displayMode: 'button' },
            link: navPageItem('donate-membership', 'Donate')?.link,
          },
          _status: 'published',
        },
      })
      navigationCreated = true
    } catch (err) {
      const message = errorMessage(err)
      log.error(`[${tenant.slug}] Failed to create navigation: ${message}`)
      failed.navigation = message
    }
  } else {
    log.info(`[${tenant.slug}] Navigation already exists, skipping`)
  }

  // Record the outcome on the tenant itself so the onboarding checklist can
  // read a single source of truth instead of re-deriving status from live
  // data. Partial = at least one step failed; Complete = everything succeeded.
  // Lives on tenants (not settings) because it's lifecycle state, not
  // configuration.
  const hasFailures = Object.keys(failed).length > 0
  const provisioningStatus: 'complete' | 'partial' = hasFailures ? 'partial' : 'complete'
  try {
    await payload.update({
      collection: 'tenants',
      id: tenant.id,
      data: {
        provisioning: {
          status: provisioningStatus,
          lastRunAt: new Date().toISOString(),
          failed: hasFailures ? failed : undefined,
        },
      },
    })
  } catch (err) {
    log.error(
      `[${tenant.slug}] Failed to record provisioning status: ${err instanceof Error ? err.message : 'Unknown error'}`,
    )
  }

  const summary = {
    tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
    settingsCreated,
    builtInPagesCreated: createdBuiltInPages.length - existingBuiltInPages.docs.length,
    pagesCreated: createdPages.length,
    failedPages: Object.keys(failed.pages ?? {}),
    homePageCreated,
    navigationCreated,
    provisioningStatus,
    // TODO: Theme creation (colors.css, centerColorMap in generateOGImage.tsx) requires manual steps.
  }

  log.info(`Provisioning complete for ${tenant.name}: ${JSON.stringify(summary)}`)
  return summary
}
