import { page } from '@/endpoints/seed/pages/page'
import { upsert, upsertGlobals } from '@/endpoints/seed/upsert'
import { getPath, getSeedImageByFilename } from '@/endpoints/seed/utilities'
import { Form, Tenant } from '@/payload-types'
import fs from 'fs'
import { headers } from 'next/headers'
import type {
  CollectionSlug,
  File,
  GlobalSlug,
  Payload,
  PayloadRequest,
  RequiredDataFromCollectionSlug,
} from 'payload'

import { whoWeArePage } from '@/endpoints/seed/pages/who-we-are-page'
import { seedStaff } from './biographies'
import { contactForm as contactFormData } from './contact-form'
import { image1 } from './image-1'
import { image2 } from './image-2'
import { imageMountain } from './image-mountain'
import { navigationSeed } from './navigation'
import { allBlocksPage } from './pages/all-blocks-page'
import { contact as contactPageData } from './pages/contact-page'
import { post1 } from './post-1'
import { post2 } from './post-2'
import { post3 } from './post-3'

const collections: CollectionSlug[] = [
  'settings',
  'biographies',
  'media',
  'pages',
  'posts',
  'forms',
  'form-submissions',
  'navigations',
  'roles',
  'globalRoleAssignments',
  'roleAssignments',
  'tags',
  'teams',
  'tenants',
]
const globalsMap: Record<
  GlobalSlug,
  {
    requiredFields: {
      version: string
      baseUrl: string
    }
  }
> = {
  nacWidgetsConfig: {
    requiredFields: {
      version: '20250602',
      baseUrl: 'https://du6amfiq9m9h7.cloudfront.net/public/v2',
    },
  },
}
const globals: GlobalSlug[] = ['nacWidgetsConfig']

// Next.js revalidation errors are normal when seeding the database without a server running
// i.e. running `yarn seed` locally instead of using the admin UI within an active app
// The app is not running to revalidate the pages and so the API routes are not available
// These error messages can be ignored: `Error hitting revalidate route for...`
export const seed = async ({
  payload,
  req,
  incremental,
}: {
  payload: Payload
  req: PayloadRequest
  incremental: boolean
}): Promise<void> => {
  payload.logger.info('Seeding database...')
  if (!incremental) {
    payload.logger.info(`— Clearing collections and globals...`)

    // clear the database
    await Promise.all(
      globals.map((global) =>
        payload.updateGlobal({
          slug: global,
          data: globalsMap[global].requiredFields,
          depth: 0,
          context: {
            disableRevalidate: true,
          },
        }),
      ),
    )

    await Promise.all(
      collections.map((collection) => {
        payload.logger.info(`Deleting collection: ${collection}`)
        return payload.db.deleteMany({ collection, req, where: {} })
      }),
    )

    await Promise.all(
      collections
        .filter((collection) => Boolean(payload.collections[collection].config.versions))
        .map((collection) => payload.db.deleteVersions({ collection, req, where: {} })),
    )

    payload.logger.info(`— Clearing users...`)

    await payload.delete({
      collection: 'users',
      depth: 0,
      where: {
        or: [
          {
            email: {
              contains: 'avy.com',
            },
          },
          {
            email: {
              contains: 'nwac.us',
            },
          },
          {
            email: {
              contains: 'sierraavalanchecenter.org',
            },
          },
          {
            email: {
              contains: 'sawtoothavalanche.com',
            },
          },
        ],
      },
    })

    payload.logger.info('- Deleting existing /public/media folder...')

    try {
      const path = getPath('public/media')
      fs.rmSync(path, { recursive: true, force: true })
    } catch (err) {
      payload.logger.error(
        `Failed to delete /public/media folder: ${err instanceof Error ? err.message : 'Unknown error'}`,
      )
    }
  } else {
    payload.logger.info(`— Skipping database cleanup for incremental seed...`)
  }

  const roles = await upsertGlobals('roles', payload, incremental, (obj) => obj.name, [
    {
      name: 'Super Admin',
      rules: [
        {
          collections: ['*'],
          actions: ['*'],
        },
      ],
    },
    {
      name: 'Admin',
      rules: [
        {
          collections: [
            'pages',
            'posts',
            'tags',
            'roleAssignments',
            'settings',
            'media',
            'biographies',
            'teams',
            'forms',
            'formSubmissions',
            'users',
            'redirects',
          ],
          actions: ['*'],
        },
        {
          collections: ['navigations', 'tenants'],
          actions: ['read'],
        },
      ],
    },
    {
      name: 'Forecaster',
      rules: [
        {
          collections: [
            'pages',
            'posts',
            'tags',
            'media',
            'biographies',
            'teams',
            'forms',
            'formSubmissions',
          ],
          actions: ['*'],
        },
      ],
    },
    {
      name: 'Non-Profit Staff',
      rules: [
        {
          collections: [
            'pages',
            'posts',
            'tags',
            'media',
            'biographies',
            'teams',
            'forms',
            'formSubmissions',
          ],
          actions: ['*'],
        },
      ],
    },
  ])

  const tenants = await upsertGlobals('tenants', payload, incremental, (obj) => obj.slug, [
    {
      name: 'Northwest Avalanche Center',
      slug: 'nwac',
      customDomain: 'nwac.us',
    },
    {
      name: 'Sierra Avalanche Center',
      slug: 'sac',
      customDomain: 'sierraavalanchecenter.org',
    },
    {
      name: 'Sawtooth Avalanche Center',
      slug: 'snfac',
      customDomain: 'sawtoothavalanche.com',
    },
  ])
  const tenantsById: Record<number, Tenant> = {}
  for (const tenant in tenants) {
    tenantsById[tenants[tenant].id] = tenants[tenant]
  }

  payload.logger.info(`— Seeding brand media...`)

  const logoFiles: Record<string, string> = {
    bac: 'BAC.webp',
    btac: 'BTAC.webp',
    caic: 'CAIC.webp',
    cbac: 'CBAC.webp',
    cnfaic: 'CNFAIC.webp',
    coaa: 'COAA.webp',
    esac: 'ESAC.webp',
    fac: 'FAC.webp',
    gnfac: 'GNFAC.webp',
    hpac: 'HPAC.webp',
    ipac: 'IPAC.webp',
    kpac: 'KPAC.webp',
    msac: 'MSAC.webp',
    mwac: 'MWAC.webp',
    nwac: 'NWAC.webp',
    pac: 'PAC.webp',
    sac: 'SAC.webp',
    snfac: 'SNFAC.webp',
    tac: 'TAC.webp',
    wac: 'WAC.webp',
    wcmac: 'WCMAC.webp',
  }
  const iconFiles: Record<string, string> = {
    nwac: 'nwac-icon.jpg',
    sac: 'sac-icon.png',
    snfac: 'snfac-icon.png',
  }
  const bannerFiles: Record<string, string> = {
    nwac: 'nwac-banner.webp',
    sac: 'sac-banner.webp',
    snfac: 'sac-usfs-logo.webp',
  }
  const usfsLogoFiles: Record<string, string> = {
    nwac: 'usfs-logo.webp',
    sac: 'usfs-logo.webp',
  }

  const logos: Record<string, File> = {}
  const icons: Record<string, File> = {}
  const banners: Record<string, File> = {}
  const usfsLogos: Record<string, File> = {}

  for (const tenantSlug in tenants) {
    if (tenantSlug in logoFiles) {
      const logo = await getSeedImageByFilename(logoFiles[tenantSlug])
      if (!logo) {
        throw new Error(`Getting logo for tenant ${tenantSlug} returned null...`)
      }
      logos[tenantSlug] = logo
    }
    if (tenantSlug in iconFiles) {
      const icon = await getSeedImageByFilename(iconFiles[tenantSlug])
      if (!icon) {
        throw new Error(`Getting icon for tenant ${tenantSlug} returned null...`)
      }
      icons[tenantSlug] = icon
    }
    if (tenantSlug in bannerFiles) {
      const banner = await getSeedImageByFilename(bannerFiles[tenantSlug])
      if (!banner) {
        throw new Error(`Getting banner for tenant ${tenantSlug} returned null...`)
      }
      banners[tenantSlug] = banner
    }
    if (tenantSlug in usfsLogoFiles) {
      const usfsLogo = await getSeedImageByFilename(usfsLogoFiles[tenantSlug])
      if (!usfsLogo) {
        throw new Error(`Getting usfsLogo for tenant ${tenantSlug} returned null...`)
      }
      usfsLogos[tenantSlug] = usfsLogo
    }
  }

  const brandImages = await upsert('media', payload, incremental, tenantsById, (obj) => obj.alt, [
    ...Object.values(tenants)
      .map((tenant): { data: RequiredDataFromCollectionSlug<'media'>; file: File }[] => [
        {
          data: {
            tenant: tenant.id,
            alt: 'logo',
          },
          file: logos[tenant.slug],
        },
        {
          data: {
            tenant: tenant.id,
            alt: 'icon',
          },
          file: logos[tenant.slug],
        },
        {
          data: {
            tenant: tenant.id,
            alt: 'banner',
          },
          file: banners[tenant.slug],
        },
        ...(usfsLogos[tenant.slug]
          ? [
              {
                data: {
                  tenant: tenant.id,
                  alt: 'usfs logo',
                },
                file: usfsLogos[tenant.slug],
              },
            ]
          : []),
      ])
      .flat(),
  ])

  // Settings
  const settingsData: Record<
    Tenant['slug'],
    Partial<RequiredDataFromCollectionSlug<'settings'>>
  > = {
    nwac: {
      description:
        'The Northwest Avalanche Center exists to increase avalanche awareness, reduce avalanche impacts, and equip the community with mountain weather and avalanche forecasts, education, and data.',

      address: '249 Main Ave. S, Suite 107-366\nNorth Bend, WA 98045',
      phone: '(206)909-0203',
      email: 'info@nwac.us',
      socialMedia: {
        instagram: 'https://www.instagram.com/nwacus',
        facebook: 'https://www.facebook.com/NWACUS/',
        twitter: 'https://x.com/nwacus',
        linkedin: 'https://www.linkedin.com/company/nw-avalanche-center',
        youtube: 'https://www.youtube.com/channel/UCXKN3Cu9rnnkukkiUUgjzFQ',
      },
    },
    sac: {
      description:
        'Backcountry Avalanche, Snow, and Weather Information for the greater Lake Tahoe area',

      address: '11260 Donner Pass Rd. Ste. C1 - PMB 401\nTruckee, CA 96161',
      phone: '(530)563-2257',
      email: 'info@sierraavalanchecenter.org',
      socialMedia: {
        instagram: 'https://www.instagram.com/savycenter/',
        facebook: 'https://www.facebook.com/sacnonprofit',
        youtube: 'https://www.youtube.com/channel/UCHdjQ0tSzYzzN0k29NaZJbQ',
      },
    },
    snfac: {
      description: 'Avalanche Safety Information for South Central Idaho',
      address: '249 Main Ave. S, Suite 107-366\nNorth Bend, WA 98045',
      phone: '(206)909-0203',
      email: 'info@nwac.us',
      socialMedia: {},
    },
  }

  await upsert(
    'settings',
    payload,
    incremental,
    tenantsById,
    (obj) => (typeof obj.tenant === 'object' ? obj.tenant.slug : 'UNKNOWN'),
    Object.values(tenants).map(
      (tenant): RequiredDataFromCollectionSlug<'settings'> => ({
        tenant: tenant.id,
        description: settingsData[tenant.slug].description,
        address: settingsData[tenant.slug].address,
        phone: settingsData[tenant.slug].phone,
        email: settingsData[tenant.slug].email,
        socialMedia: settingsData[tenant.slug].socialMedia,
        logo: brandImages[tenant.slug]['logo'].id,
        icon: brandImages[tenant.slug]['icon'].id,
        banner: brandImages[tenant.slug]['banner'].id,
        usfsLogo: brandImages[tenant.slug]['usfs logo']?.id,
      }),
    ),
  )

  if (!process.env.PAYLOAD_SEED_PASSWORD && process.env.ALLOW_SIMPLE_PASSWORDS !== 'true') {
    payload.logger.fatal(
      "$PAYLOAD_SEED_PASSWORD missing and ALLOW_SIMPLE_PASSWORDS not set to 'true' - either opt into simple passwords or provide a seed password.",
    )
    throw new Error('Invalid request.')
  }
  const password = process.env.PAYLOAD_SEED_PASSWORD || 'localpass'
  payload.logger.info(`— Using password '${password}'...`)
  const users = await upsertGlobals('users', payload, incremental, (obj) => obj.email, [
    {
      name: 'Super Admin',
      email: 'admin@avy.com',
      password: password,
    },
    ...Object.values(tenants)
      .map((tenant): RequiredDataFromCollectionSlug<'users'>[] => [
        {
          name: tenant.slug.toUpperCase() + ' Admin',
          email: 'admin@' + (tenant.customDomain as NonNullable<Tenant['customDomain']>),
          password: password,
        },
        {
          name: tenant.slug.toUpperCase() + ' Forecaster',
          email: 'forecaster@' + (tenant.customDomain as NonNullable<Tenant['customDomain']>),
          password: password,
        },
        {
          name: tenant.slug.toUpperCase() + ' Non-Profit Staff',
          email: 'staff@' + (tenant.customDomain as NonNullable<Tenant['customDomain']>),
          password: password,
        },
      ])
      .flat(),
    {
      name: 'Multi-center Admin',
      email: 'multicenter@avy.com',
      password: password,
    },
  ])

  const teams = await seedStaff(payload, incremental, tenants, tenantsById, users)

  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })
  const globalRoleAssignments: RequiredDataFromCollectionSlug<'globalRoleAssignments'>[] = [
    {
      roles: [roles['Super Admin'].id],
      user: users['Super Admin'].id,
    },
  ]
  if (user && user.email !== users['Super Admin'].email) {
    globalRoleAssignments.push({
      roles: [roles['Super Admin'].id],
      user: user.id,
    })
  }
  // SuperAdminRoleAssignment
  await upsertGlobals(
    'globalRoleAssignments',
    payload,
    incremental,
    (obj) => `${obj.user} ${JSON.stringify(obj.roles)}`,
    globalRoleAssignments,
  )

  // Roles
  await upsert(
    'roleAssignments',
    payload,
    incremental,
    tenantsById,
    (obj) => `${obj.user} ${JSON.stringify(obj.roles)}`,
    [
      ...Object.values(tenants)
        .map((tenant): RequiredDataFromCollectionSlug<'roleAssignments'>[] => [
          {
            tenant: tenant.id,
            roles: [roles['Admin'].id],
            user: users[tenant.slug.toUpperCase() + ' Admin'].id,
          },
          {
            tenant: tenant.id,
            roles: [roles['Forecaster'].id],
            user: users[tenant.slug.toUpperCase() + ' Forecaster'].id,
          },

          {
            tenant: tenant.id,
            roles: [roles['Non-Profit Staff'].id],
            user: users[tenant.slug.toUpperCase() + ' Non-Profit Staff'].id,
          },
        ])
        .flat(),
      {
        tenant: tenants['snfac'].id,
        roles: [roles['Admin'].id],
        user: users['Multi-center Admin'].id,
      },
      {
        tenant: tenants['nwac'].id,
        roles: [roles['Admin'].id],
        user: users['Multi-center Admin'].id,
      },
    ],
  )

  payload.logger.info(`— Getting images...`)

  const [image1Buffer, image2Buffer, image3Buffer, imageMountainBuffer] = await Promise.all([
    getSeedImageByFilename('image-post1.webp'),
    getSeedImageByFilename('image-post2.webp'),
    getSeedImageByFilename('image-post3.webp'),
    getSeedImageByFilename('image-post3.webp'),
  ])

  const images = await upsert(
    'media',
    payload,
    incremental,
    tenantsById,
    (obj) => obj.alt,
    Object.values(tenants)
      .map((tenant): { data: RequiredDataFromCollectionSlug<'media'>; file: File }[] => [
        {
          data: image1(tenant),
          file: image1Buffer,
        },
        {
          data: image2(tenant),
          file: image2Buffer,
        },
        {
          data: (() => {
            const i = image2(tenant)
            i.alt = 'image3'
            return i
          })(),
          file: image3Buffer,
        },
        {
          data: imageMountain(tenant),
          file: imageMountainBuffer,
        },
      ])
      .flat(),
  )
  // Tags
  const tags = await upsert(
    'tags',
    payload,
    incremental,
    tenantsById,
    (obj) => obj.title,
    Object.values(tenants)
      .map((tenant): RequiredDataFromCollectionSlug<'tags'>[] => [
        {
          title: 'Education',
          slug: 'education',
          tenant: tenant.id,
        },
        {
          title: 'Gear',
          slug: 'gear',
          tenant: tenant.id,
        },
        {
          title: 'Volunteers',
          slug: 'volunteers',
          tenant: tenant.id,
        },
      ])
      .flat(),
  )
  const posts = await upsert(
    'posts',
    payload,
    incremental,
    tenantsById,
    (obj) => obj.slug,
    Object.values(tenants)
      .map((tenant): RequiredDataFromCollectionSlug<'posts'>[] => [
        post1(tenant, images[tenant.slug]['image1'], images[tenant.slug]['image2'], [
          users[tenant.slug.toUpperCase() + ' Forecaster'],
          users[tenant.slug.toUpperCase() + ' Admin'],
        ]),
        post2(
          tenant,
          images[tenant.slug]['image2'],
          images[tenant.slug]['image3'],
          users[tenant.slug.toUpperCase() + ' Admin'],
        ),
        post3(
          tenant,
          images[tenant.slug]['image3'],
          images[tenant.slug]['image1'],
          users[tenant.slug.toUpperCase() + ' Forecaster'],
        ),
      ])
      .flat(),
  )

  payload.logger.info(`— Updating post relationships...`)
  for (const tenant in posts) {
    Object.values(posts[tenant]).forEach(async (post, index) => {
      payload.logger.info(
        `Updating posts['${tenantsById[typeof post.tenant === 'number' ? post.tenant : post.tenant.id].slug}']['${post.slug}']...`,
      )
      const randomTagId = Object.values(tags[tenant]).map((tag) => tag.id)[index]

      await payload.update({
        id: post.id,
        collection: 'posts',
        data: {
          relatedPosts: Object.values(posts[tenant])
            .filter((p) => p.id !== post.id)
            .map((p) => p.id),
          tags: [randomTagId],
        },
      })
    })
  }

  payload.logger.info(`— Seeding contact forms...`)

  const contactForms: Record<string, Form> = {}
  for (const tenant of Object.values(tenants)) {
    payload.logger.info(`Creating contact form for tenant ${tenant.name}...`)
    const contactForm = await payload.create({
      collection: 'forms',
      depth: 0,
      data: { ...contactFormData, tenant: tenant.id },
    })

    if (!contactForm) {
      throw new Error(`Creating contact form for tenant ${tenant.name} returned null...`)
    }
    contactForms[tenant.name] = contactForm
  }

  const pages = await upsert(
    'pages',
    payload,
    incremental,
    tenantsById,
    (obj) => obj.slug,
    Object.values(tenants)
      .map((tenant): RequiredDataFromCollectionSlug<'pages'>[] => [
        contactPageData(tenant, contactForms[tenant.name]),
        allBlocksPage(tenant, images[tenant.slug]['imageMountain']),
        whoWeArePage(tenant, teams, images[tenant.slug]['image2']),
        page(
          tenant,
          images[tenant.slug]['image2'],
          'Donate & Membership',
          'Support avalanche safety by becoming a member or donating to the avalanche center.',
          'donate-membership',
        ),
        page(
          tenant,
          images[tenant.slug]['image2'],
          'Workplace Giving',
          'Have you thought about donating to the center through work? Your employer may be able to help you support avalanche safety.',
          'workplace-giving',
        ),
        page(
          tenant,
          images[tenant.slug]['image2'],
          'Other Ways to Give',
          'Learn about alternative methods to support the avalanche center and its mission.',
          'other-ways-to-give',
        ),
        page(
          tenant,
          images[tenant.slug]['image2'],
          'Corporate Sponsorship',
          "The avalanche center's work is supported by the generosity of our industry partners.",
          'corporate-sponsorship',
        ),
        page(
          tenant,
          images[tenant.slug]['image2'],
          'Volunteer',
          'Interested in volunteering your time for the center? We are always looking for help at events and with various projects.',
          'volunteer',
        ),
        page(
          tenant,
          images[tenant.slug]['image2'],
          'About Us',
          'The avalanche center exists to increase avalanche awareness, reduce avalanche impacts, and equip the community with mountain weather and avalanche forecasts, education, and data.',
          'about-us',
        ),
        page(
          tenant,
          images[tenant.slug]['image2'],
          'Agency Partners',
          'The avalanche center collaborates with various agencies to enhance avalanche safety and awareness.',
          'agency-partners',
        ),
        page(
          tenant,
          images[tenant.slug]['image2'],
          'Annual Report/Minutes',
          "Access the avalanche center's annual reports and meeting minutes.",
          'annual-report-minutes',
        ),
        page(
          tenant,
          images[tenant.slug]['image2'],
          'Employment',
          'Explore career opportunities with the avalanche center.',
          'employment',
        ),
        page(
          tenant,
          images[tenant.slug]['image2'],
          'Learn',
          'Discover resources and opportunities to learn about avalanche safety and awareness.',
          'learn',
        ),
        page(
          tenant,
          images[tenant.slug]['image2'],
          'Field Classes',
          'Participate in field-based avalanche education classes offered by the center.',
          'field-classes',
        ),
        page(
          tenant,
          images[tenant.slug]['image2'],
          'Avalanche Awareness Classes',
          'The avalanche center offers free avalanche classes to the public throughout our forecast area.',
          'avalanche-awareness-classes',
        ),
        page(
          tenant,
          images[tenant.slug]['image2'],
          'Courses by External Providers',
          'Find avalanche education courses offered by external providers in your area.',
          'courses-by-external-providers',
        ),
        page(
          tenant,
          images[tenant.slug]['image2'],
          'Workshops',
          'Join specialized avalanche safety workshops for skill development and knowledge enhancement.',
          'workshops',
        ),
        page(
          tenant,
          images[tenant.slug]['image2'],
          'Request a Class',
          'Request an avalanche awareness or safety class for your group or organization.',
          'request-a-class',
        ),
        page(
          tenant,
          images[tenant.slug]['image2'],
          'Scholarships',
          'Learn about scholarships available for avalanche education and training.',
          'scholarships',
        ),
        page(
          tenant,
          images[tenant.slug]['image2'],
          'Mentorship',
          'Connect with experienced backcountry travelers through our mentorship program.',
          'mentorship',
        ),
        page(
          tenant,
          images[tenant.slug]['image2'],
          'Beacon Parks',
          'Locate and use avalanche beacon practice parks in your area.',
          'beacon-parks',
        ),
        page(
          tenant,
          images[tenant.slug]['image2'],
          'Local Accident Reports',
          'Access reports of avalanche accidents in your local area.',
          'local-accident-reports',
        ),
        page(
          tenant,
          images[tenant.slug]['image2'],
          'Avalanche Accident Statistics',
          'Review statistical data on avalanche accidents and incidents.',
          'avalanche-accident-statistics',
        ),
        page(
          tenant,
          images[tenant.slug]['image2'],
          'US Avalanche Accidents',
          'Information about avalanche accidents across the United States.',
          'us-avalanche-accidents',
        ),
        page(
          tenant,
          images[tenant.slug]['image2'],
          'Grief and Loss Resources',
          'Support resources for those affected by avalanche tragedies.',
          'grief-and-loss-resources',
        ),
        page(
          tenant,
          images[tenant.slug]['image2'],
          'Avalanche Accident Map',
          'Interactive map showing locations of avalanche accidents and incidents.',
          'avalanche-accident-map',
        ),
        page(
          tenant,
          images[tenant.slug]['image2'],
          'Weather Tools',
          'A list of weather links.',
          'weather-tools',
        ),
      ])
      .flat(),
  )

  // Navigations
  await upsert(
    'navigations',
    payload,
    incremental,
    tenantsById,
    (_obj) => 'nav',
    Object.values(tenants).map(
      (tenant): RequiredDataFromCollectionSlug<'navigations'> =>
        navigationSeed(payload, pages, tenant),
    ),
  )

  payload.logger.info('Seeded database successfully!')
}
