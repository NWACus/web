import { hasSuperAdminPermissions } from '@/access/hasSuperAdminPermissions'
import { getSeedImageByFilename, simpleContent } from '@/endpoints/seed/utilities'
import type { BuiltInPage, Page, Tenant } from '@/payload-types'
import type { Payload, PayloadHandler } from 'payload'

const TEMPLATE_TENANT_SLUG = 'dvac'

// Page slugs that should not be copied during provisioning (e.g. demo/showcase pages)
export const SKIP_PAGE_SLUGS = new Set(['blocks', 'lexical-blocks'])

export const BUILT_IN_PAGES: Array<{ title: string; url: string }> = [
  { title: 'All Forecasts', url: '/forecasts/avalanche' },
  { title: 'Mountain Weather', url: '/weather/forecast' },
  { title: 'Weather Stations', url: '/weather/stations/map' },
  { title: 'Recent Observations', url: '/observations' },
  { title: 'Submit Observations', url: '/observations/submit' },
  { title: 'Blog', url: '/blog' },
  { title: 'Events', url: '/events' },
]

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
    // Create the tenant
    const tenant = await payload.create({
      collection: 'tenants',
      data: {
        name: body.name,
        slug: body.slug,
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
 * 2. Built-in pages (forecasts, weather stations, observations)
 * 3. Blank pages matching the template tenant's (DVAC) page structure
 * 4. Home page with default content
 * 5. Navigation linked to the new pages and built-in pages
 *
 * Idempotent - checks for existing data before creating.
 */
export async function provision(payload: Payload, tenant: Tenant) {
  const log = payload.logger

  log.info(`Provisioning tenant: ${tenant.name} (${tenant.slug})`)

  // 1. Create Website Settings with placeholder brand assets
  log.info(`[${tenant.slug}] Creating website settings...`)
  const existingSettings = await payload.find({
    collection: 'settings',
    where: { tenant: { equals: tenant.id } },
    limit: 1,
  })
  let settingsCreated = false
  if (existingSettings.docs.length === 0) {
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
  } else {
    log.info(`[${tenant.slug}] Website settings already exist, skipping`)
  }

  // 2. Create Built-In Pages
  log.info(`[${tenant.slug}] Creating built-in pages...`)
  const existingBuiltInPages = await payload.find({
    collection: 'builtInPages',
    where: { tenant: { equals: tenant.id } },
    limit: 100,
  })
  const existingBuiltInPageUrls = new Set(existingBuiltInPages.docs.map((p) => p.url))

  const createdBuiltInPages: BuiltInPage[] = [...existingBuiltInPages.docs]
  for (const { title, url } of BUILT_IN_PAGES) {
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

  // 3. Create blank pages from template tenant (DVAC) page structure
  log.info(
    `[${tenant.slug}] Creating blank pages from template tenant (${TEMPLATE_TENANT_SLUG})...`,
  )
  const templateTenant = await payload
    .find({
      collection: 'tenants',
      where: { slug: { equals: TEMPLATE_TENANT_SLUG } },
      limit: 1,
    })
    .then((res) => res.docs[0])

  const createdPages: Page[] = []
  const failedPages: string[] = []
  // Maps page slug to new page for navigation linking
  const pagesBySlug: Record<string, Page> = {}

  if (templateTenant) {
    const templatePages = await payload.find({
      collection: 'pages',
      where: {
        tenant: { equals: templateTenant.id },
        _status: { equals: 'published' },
      },
      limit: 500,
      depth: 0,
    })

    // Check which pages already exist for this tenant (full objects for nav linking)
    const existingPages = await payload.find({
      collection: 'pages',
      where: { tenant: { equals: tenant.id } },
      limit: 500,
      depth: 0,
    })
    const existingPagesBySlug = new Map(existingPages.docs.map((p) => [p.slug, p]))

    for (const templatePage of templatePages.docs) {
      if (SKIP_PAGE_SLUGS.has(templatePage.slug)) {
        log.info(`[${tenant.slug}] Skipping "${templatePage.title}" (demo page)`)
        continue
      }
      const existing = existingPagesBySlug.get(templatePage.slug)
      if (existing) {
        log.info(`[${tenant.slug}] Page "${templatePage.title}" already exists, skipping`)
        pagesBySlug[existing.slug] = existing
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
            title: templatePage.title,
            slug: templatePage.slug,
            _status: 'published',
            publishedAt: new Date().toISOString(),
          },
        })
        createdPages.push(newPage)
        pagesBySlug[newPage.slug] = newPage
      } catch (err) {
        log.error(
          `[${tenant.slug}] Failed to create page "${templatePage.title}" (slug: ${templatePage.slug}): ${err instanceof Error ? err.message : 'Unknown error'}`,
        )
        failedPages.push(templatePage.title)
      }
    }

    // Also index any pre-existing pages we didn't create (from the initial query)
    for (const p of existingPages.docs) {
      if (!pagesBySlug[p.slug]) {
        pagesBySlug[p.slug] = p
      }
    }
  } else {
    log.warn(`Template tenant "${TEMPLATE_TENANT_SLUG}" not found. Skipping page creation.`)
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
      log.error(
        `[${tenant.slug}] Failed to create home page: ${err instanceof Error ? err.message : 'Unknown error'}`,
      )
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
          forecasts: { items: [] },
          observations: { items: [] },
          weather: {
            items: filterNulls([
              navBuiltInPageItem('/weather/stations/map', 'Weather Stations'),
              navPageItem('weather-tools'),
            ]),
          },
          education: {
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
            items: filterNulls([
              navPageItem('about-us'),
              navPageItem('agency-partners'),
              navPageItem('who-we-are'),
              navPageItem('annual-report-minutes'),
              navPageItem('employment'),
            ]),
          },
          support: {
            items: filterNulls([
              navPageItem('donate-membership'),
              navPageItem('workplace-giving'),
              navPageItem('other-ways-to-give'),
              navPageItem('corporate-sponsorship'),
              navPageItem('volunteer'),
            ]),
          },
          accidents: {
            items: filterNulls([
              navPageItem('local-accident-reports'),
              navPageItem('avalanche-accident-statistics'),
              navPageItem('us-avalanche-accidents'),
              navPageItem('grief-and-loss-resources'),
              navPageItem('avalanche-accident-map'),
            ]),
          },
          donate: {
            link: navPageItem('donate-membership', 'Donate')?.link,
          },
          _status: 'published',
        },
      })
      navigationCreated = true
    } catch (err) {
      log.error(
        `[${tenant.slug}] Failed to create navigation: ${err instanceof Error ? err.message : 'Unknown error'}`,
      )
    }
  } else {
    log.info(`[${tenant.slug}] Navigation already exists, skipping`)
  }

  const summary = {
    tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
    settingsCreated,
    builtInPagesCreated: createdBuiltInPages.length - existingBuiltInPages.docs.length,
    pagesCreated: createdPages.length,
    failedPages,
    homePageCreated,
    navigationCreated,
    // TODO: Theme creation (colors.css, centerColorMap in generateOGImage.tsx) requires manual steps.
  }

  log.info(`Provisioning complete for ${tenant.name}: ${JSON.stringify(summary)}`)
  return summary
}
