import { hasSuperAdminPermissions } from '@/access/hasSuperAdminPermissions'
import { getSeedImageByFilename, simpleContent } from '@/endpoints/seed/utilities'
import type { BuiltInPage, Navigation, Page, Tenant } from '@/payload-types'
import { isValidRelationship } from '@/utilities/relationships'
import type { Payload, PayloadHandler } from 'payload'

const TEMPLATE_TENANT_SLUG = 'dvac'

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
 * 2. Look up template tenant (DVAC) navigation to determine which pages to create
 * 3. Built-in pages (filtered to those referenced in template navigation)
 * 4. Blank pages matching the template tenant's page structure
 * 5. Home page with default content
 * 6. Navigation linked to the new pages and built-in pages
 *
 * Idempotent - checks for existing data before creating.
 */
/**
 * Extracts page slugs from a resolved navigation document.
 * Walks all DVAC nav tabs' items (and sub-items) and collects slugs
 * from internal page references.
 */
export type NavReferences = {
  pageSlugs: Set<string>
  builtInPageUrls: Set<string>
}

export function extractNavReferences(nav: Navigation): NavReferences {
  const pageSlugs = new Set<string>()
  const builtInPageUrls = new Set<string>()

  for (const tab of Object.values(nav)) {
    if (typeof tab === 'object' && tab !== null) {
      // Tab with items array (forecasts, weather, education, etc.)
      if ('items' in tab && Array.isArray(tab.items)) {
        for (const item of tab.items) {
          buildNavReference(item.link, pageSlugs, builtInPageUrls)
          if (Array.isArray(item.items)) {
            for (const subItem of item.items) {
              buildNavReference(subItem.link, pageSlugs, builtInPageUrls)
            }
          }
        }
      }

      // Tab with a direct link (donate)
      if ('link' in tab) {
        buildNavReference(tab.link, pageSlugs, builtInPageUrls)
      }
    }
  }

  return { pageSlugs, builtInPageUrls }
}

function buildNavReference(
  link:
    | { reference?: { relationTo: string; value: number | { id: string | number } } | null }
    | null
    | undefined,
  pageSlugs: Set<string>,
  builtInPageUrls: Set<string>,
): void {
  const ref = link?.reference
  if (!ref || !isValidRelationship(ref.value)) return

  if (ref.relationTo === 'pages' && 'slug' in ref.value) {
    pageSlugs.add(String(ref.value.slug))
  } else if (ref.relationTo === 'builtInPages' && 'url' in ref.value) {
    builtInPageUrls.add(String(ref.value.url))
  }
}

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

  // 2. Look up template tenant navigation to determine which pages to create
  log.info(`[${tenant.slug}] Looking up template tenant (${TEMPLATE_TENANT_SLUG}) navigation...`)
  const templateTenant = await payload
    .find({
      collection: 'tenants',
      where: { slug: { equals: TEMPLATE_TENANT_SLUG } },
      limit: 1,
    })
    .then((res) => res.docs[0])

  let navPageSlugs = new Set<string>()
  let navBuiltInPageUrls = new Set<string>()

  if (templateTenant) {
    const templateNav = await payload
      .find({
        collection: 'navigations',
        where: { tenant: { equals: templateTenant.id } },
        limit: 1,
        depth: 1,
      })
      .then((res) => res.docs[0])

    const refs = extractNavReferences(templateNav ?? {})
    navPageSlugs = refs.pageSlugs
    navBuiltInPageUrls = refs.builtInPageUrls
    log.info(
      `[${tenant.slug}] Found ${navPageSlugs.size} page slugs and ${navBuiltInPageUrls.size} built-in page URLs in template navigation`,
    )
  } else {
    log.warn(`Template tenant "${TEMPLATE_TENANT_SLUG}" not found. Using default built-in pages.`)
  }

  // 3. Create Built-In Pages
  // TODO: Filter to only navigation-referenced built-in pages #999
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

  // 4. Create blank pages for pages referenced in template navigation
  const createdPages: Page[] = []
  const failedPages: string[] = []
  const pagesBySlug: Record<string, Page> = {}

  if (templateTenant) {
    // Query the template pages that are referenced in navigation
    const templatePages = await payload.find({
      collection: 'pages',
      where: {
        tenant: { equals: templateTenant.id },
        _status: { equals: 'published' },
        slug: { in: [...navPageSlugs].join(',') },
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
  }

  // 5. Create Home Page
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

  // 6. Create Navigation
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
          forecasts: { options: { displayMode: 'dropdown' }, items: [] },
          observations: { options: { displayMode: 'dropdown' }, items: [] },
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
          donate: {
            options: { displayMode: 'button' },
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
