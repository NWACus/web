import { hasSuperAdminPermissions } from '@/access/hasSuperAdminPermissions'
import { getSeedImageByFilename } from '@/endpoints/seed/utilities'
import type { BuiltInPage, Page, Tenant } from '@/payload-types'
import { removeIdKey } from '@/utilities/removeIdKey'
import type { Payload, PayloadHandler } from 'payload'

const TEMPLATE_TENANT_SLUG = 'dvac'

// Block types that reference tenant-scoped data (teams, sponsors, events) and can't
// be copied to a new tenant without the corresponding records existing.
export const TENANT_SCOPED_BLOCK_TYPES = new Set([
  'team',
  'sponsors',
  'singleEvent',
  'singleBlogPost',
  'formBlock',
])

// Page slugs that should not be copied during provisioning (e.g. demo/showcase pages)
export const SKIP_PAGE_SLUGS = new Set(['blocks', 'lexical-blocks'])

const BUILT_IN_PAGES: Array<{ title: string; url: string }> = [
  { title: 'All Forecasts', url: '/forecasts/avalanche' },
  { title: 'Weather Stations', url: '/weather/stations/map' },
  { title: 'Recent Observations', url: '/observations' },
  { title: 'Submit Observations', url: '/observations/submit' },
]

/**
 * Creates a new tenant and provisions it with all default data.
 *
 * POST /api/tenants/provision
 * Body: { name: string, slug: string, customDomain?: string }
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
    // Create the tenant (allowDirectCreate bypasses the beforeChange guard)
    const tenant = await payload.create({
      collection: 'tenants',
      data: {
        name: body.name,
        slug: body.slug,
        customDomain: body.customDomain || '',
      },
      context: { skipProvision: true },
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
 * 3. Pages copied from the template tenant (DVAC)
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

  // 3. Copy pages from template tenant (DVAC)
  log.info(`[${tenant.slug}] Copying pages from template tenant (${TEMPLATE_TENANT_SLUG})...`)
  const templateTenant = await payload
    .find({
      collection: 'tenants',
      where: { slug: { equals: TEMPLATE_TENANT_SLUG } },
      limit: 1,
    })
    .then((res) => res.docs[0])

  const copiedPages: Page[] = []
  const failedPages: string[] = []
  // Maps template page slug to new page for navigation linking
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
        // If the existing page is a draft (e.g. from a previous failed copy), delete and retry
        if (existing._status === 'draft') {
          log.info(
            `[${tenant.slug}] Page "${templatePage.title}" exists as draft, deleting to retry`,
          )
          await payload.delete({ collection: 'pages', id: existing.id })
        } else {
          log.info(`[${tenant.slug}] Page "${templatePage.title}" already exists, skipping copy`)
          pagesBySlug[existing.slug] = existing
          continue
        }
      }

      const cleanedPage = removeIdKey(templatePage)
      // Filter out blocks that reference tenant-scoped data (teams, sponsors, events, forms)
      // since those records won't exist for the new tenant.
      // For blocks with optional static references (blogList, eventList), convert to dynamic mode.
      const layout = Array.isArray(cleanedPage.layout)
        ? cleanedPage.layout
            .filter(
              (block: { blockType?: string }) =>
                !block.blockType || !TENANT_SCOPED_BLOCK_TYPES.has(block.blockType),
            )
            .map((block) => {
              if (block.blockType === 'blogList' && block.postOptions === 'static') {
                return { ...block, postOptions: 'dynamic' as const, staticOptions: undefined }
              }
              if (block.blockType === 'eventList' && block.eventOptions === 'static') {
                return { ...block, eventOptions: 'dynamic' as const, staticOpts: undefined }
              }
              return block
            })
        : cleanedPage.layout
      // If all blocks were stripped, create as draft since layout is required
      const hasContent = Array.isArray(layout) && layout.length > 0
      try {
        const newPage = await payload.create({
          collection: 'pages',
          data: {
            ...cleanedPage,
            layout,
            tenant: tenant.id,
            title: templatePage.title,
            slug: templatePage.slug,
            _status: hasContent ? 'published' : 'draft',
            publishedAt: hasContent ? new Date().toISOString() : undefined,
          },
          draft: !hasContent,
        })
        copiedPages.push(newPage)
        pagesBySlug[newPage.slug] = newPage
      } catch (err) {
        log.error(
          `[${tenant.slug}] Failed to copy page "${templatePage.title}" (slug: ${templatePage.slug}): ${err instanceof Error ? err.message : 'Unknown error'}`,
        )
        failedPages.push(templatePage.title)
      }
    }

    // Also index any pre-existing pages we didn't copy (from the initial query)
    for (const p of existingPages.docs) {
      if (!pagesBySlug[p.slug]) {
        pagesBySlug[p.slug] = p
      }
    }
  } else {
    log.warn(`Template tenant "${TEMPLATE_TENANT_SLUG}" not found. Skipping page copy.`)
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
                richText: {
                  root: {
                    type: 'root',
                    format: '',
                    indent: 0,
                    version: 1,
                    children: [
                      {
                        type: 'paragraph',
                        format: '',
                        indent: 0,
                        version: 1,
                        children: [
                          {
                            mode: 'normal',
                            text: 'Stay informed with the latest avalanche forecasts, mountain weather conditions, and safety information for our region.',
                            type: 'text',
                            style: '',
                            detail: 0,
                            format: 0,
                            version: 1,
                          },
                        ],
                        direction: 'ltr',
                        textStyle: '',
                        textFormat: 0,
                      },
                    ],
                    direction: 'ltr',
                  },
                },
              },
              {
                richText: {
                  root: {
                    type: 'root',
                    format: '',
                    indent: 0,
                    version: 1,
                    children: [
                      {
                        type: 'paragraph',
                        format: '',
                        indent: 0,
                        version: 1,
                        children: [
                          {
                            mode: 'normal',
                            text: 'Our mission is to increase avalanche awareness, reduce avalanche impacts, and equip the community with essential safety education and data.',
                            type: 'text',
                            style: '',
                            detail: 0,
                            format: 0,
                            version: 1,
                          },
                        ],
                        direction: 'ltr',
                        textStyle: '',
                        textFormat: 0,
                      },
                    ],
                    direction: 'ltr',
                  },
                },
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
          _status: 'published',
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
    pagesCopied: copiedPages.length,
    failedPages,
    homePageCreated,
    navigationCreated,
    // TODO: Theme creation (colors.css, centerColorMap in generateOGImage.tsx) requires manual steps.
    // TODO: Custom domain configuration requires manual Vercel and DNS setup.
  }

  log.info(`Provisioning complete for ${tenant.name}: ${JSON.stringify(summary)}`)
  return summary
}
