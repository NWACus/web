import { page } from '@/endpoints/seed/pages/page'
import { upsert, upsertGlobals } from '@/endpoints/seed/upsert'
import { fetchFileByURL } from '@/endpoints/seed/utilities'
import { Form, Tenant } from '@/payload-types'
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
  'brands',
  'themes',
  'palettes',
  'biographies',
  'media',
  'pages',
  'posts',
  'forms',
  'form-submissions',
  'search',
  'navigations',
  'roles',
  'globalRoleAssignments',
  'roleAssignments',
  'teams',
  'tenants',
]
const globals: GlobalSlug[] = ['footer']

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
          data: {
            navItems: [],
          },
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
  } else {
    payload.logger.info(`— Skipping database cleanup for incremental seed...`)
  }

  const palettes = await upsertGlobals('palettes', payload, incremental, (obj) => obj.name, [
    {
      name: 'Zinc Light',
      background: '0 0% 100%',
      foreground: '240 10% 3.9%',
      card: '0 0% 100%',
      'card-foreground': '240 10% 3.9%',
      popover: '0 0% 100%',
      'popover-foreground': '240 10% 3.9%',
      primary: '240 5.9% 10%',
      'primary-foreground': '0 0% 98%',
      secondary: '240 4.8% 95.9%',
      'secondary-foreground': '240 5.9% 10%',
      muted: '240 4.8% 95.9%',
      'muted-foreground': '240 3.8% 46.1%',
      accent: '240 4.8% 95.9%',
      'accent-foreground': '240 5.9% 10%',
      destructive: '0 84.2% 60.2%',
      'destructive-foreground': '0 0% 98%',
      border: '240 5.9% 90%',
      input: '240 5.9% 90%',
      ring: '240 5.9% 10%',
      radius: '0.5rem',
      'chart-1': '12 76% 61%',
      'chart-2': '173 58% 39%',
      'chart-3': '197 37% 24%',
      'chart-4': '43 74% 66%',
      'chart-5': '27 87% 67%',
    },
    {
      name: 'Zinc Dark',
      radius: '0.5rem',
      background: '240 10% 3.9%',
      foreground: '0 0% 98%',
      card: '240 10% 3.9%',
      'card-foreground': '0 0% 98%',
      popover: '240 10% 3.9%',
      'popover-foreground': '0 0% 98%',
      primary: '0 0% 98%',
      'primary-foreground': '240 5.9% 10%',
      secondary: '240 3.7% 15.9%',
      'secondary-foreground': '0 0% 98%',
      muted: '240 3.7% 15.9%',
      'muted-foreground': '240 5% 64.9%',
      accent: '240 3.7% 15.9%',
      'accent-foreground': '0 0% 98%',
      destructive: '0 62.8% 30.6%',
      'destructive-foreground': '0 0% 98%',
      border: '240 3.7% 15.9%',
      input: '240 3.7% 15.9%',
      ring: '240 4.9% 83.9%',
      'chart-1': '220 70% 50%',
      'chart-2': '160 60% 45%',
      'chart-3': '30 80% 55%',
      'chart-4': '280 65% 60%',
      'chart-5': '340 75% 55%',
    },
    {
      name: 'Blue Light',
      radius: '0.5rem',
      background: '0 0% 100%',
      foreground: '222.2 84% 4.9%',
      card: '0 0% 100%',
      'card-foreground': '222.2 84% 4.9%',
      popover: '0 0% 100%',
      'popover-foreground': '222.2 84% 4.9%',
      primary: '221.2 83.2% 53.3%',
      'primary-foreground': '210 40% 98%',
      secondary: '210 40% 96.1%',
      'secondary-foreground': '222.2 47.4% 11.2%',
      muted: '210 40% 96.1%',
      'muted-foreground': '215.4 16.3% 46.9%',
      accent: '210 40% 96.1%',
      'accent-foreground': '222.2 47.4% 11.2%',
      destructive: '0 84.2% 60.2%',
      'destructive-foreground': '210 40% 98%',
      border: '214.3 31.8% 91.4%',
      input: '214.3 31.8% 91.4%',
      ring: '221.2 83.2% 53.3%',
      'chart-1': '12 76% 61%',
      'chart-2': '173 58% 39%',
      'chart-3': '197 37% 24%',
      'chart-4': '43 74% 66%',
      'chart-5': '27 87% 67%',
    },
    {
      name: 'Blue Dark',
      radius: '0.5rem',
      background: '222.2 84% 4.9%',
      foreground: '210 40% 98%',
      card: '222.2 84% 4.9%',
      'card-foreground': '210 40% 98%',
      popover: '222.2 84% 4.9%',
      'popover-foreground': '210 40% 98%',
      primary: '217.2 91.2% 59.8%',
      'primary-foreground': '222.2 47.4% 11.2%',
      secondary: '217.2 32.6% 17.5%',
      'secondary-foreground': '210 40% 98%',
      muted: '217.2 32.6% 17.5%',
      'muted-foreground': '215 20.2% 65.1%',
      accent: '217.2 32.6% 17.5%',
      'accent-foreground': '210 40% 98%',
      destructive: '0 62.8% 30.6%',
      'destructive-foreground': '210 40% 98%',
      border: '217.2 32.6% 17.5%',
      input: '217.2 32.6% 17.5%',
      ring: '224.3 76.3% 48%',
      'chart-1': '220 70% 50%',
      'chart-2': '160 60% 45%',
      'chart-3': '30 80% 55%',
      'chart-4': '280 65% 60%',
      'chart-5': '340 75% 55%',
    },
  ])

  const themes = await upsertGlobals('themes', payload, incremental, (obj) => obj.name, [
    {
      name: 'Zinc',
      activeColors: {
        light: '240 5.9% 10%',
        dark: '240 5.2% 33.9%',
      },
      palettes: {
        light: palettes['Zinc Light'].id,
        dark: palettes['Zinc Dark'].id,
      },
    },
    {
      name: 'Blue',
      activeColors: {
        light: '221.2 83.2% 53.3%',
        dark: '217.2 91.2% 59.8%',
      },
      palettes: {
        light: palettes['Blue Light'].id,
        dark: palettes['Blue Dark'].id,
      },
    },
  ])

  const roles = await upsertGlobals('roles', payload, incremental, (obj) => obj.name, [
    {
      name: 'Admin',
      rules: [
        {
          collections: ['*'],
          actions: ['*'],
        },
      ],
    },
    {
      name: 'User Administrator',
      rules: [
        {
          collections: ['roleAssignments'],
          actions: ['create', 'read', 'update'],
        },
      ],
    },
    {
      name: 'Contributor',
      rules: [
        {
          collections: ['posts', 'pages', 'media'],
          actions: ['*'],
        },
      ],
    },
    {
      name: 'Viewer',
      rules: [
        {
          collections: ['*'],
          actions: ['read'],
        },
      ],
    },
  ])

  const tenants = await upsertGlobals('tenants', payload, incremental, (obj) => obj.slug, [
    {
      name: 'Northwest Avalanche Center',
      slug: 'nwac',
      domains: [{ domain: 'nwac.us' }],
    },
    {
      name: 'Sierra Avalanche Center',
      slug: 'sac',
      domains: [{ domain: 'sierraavalanchecenter.org' }],
    },
    {
      name: 'Sawtooth Avalanche Center',
      slug: 'snfac',
      domains: [{ domain: 'sawtoothavalanche.com' }],
    },
  ])
  const tenantsById: Record<number, Tenant> = {}
  for (const tenant in tenants) {
    tenantsById[tenants[tenant].id] = tenants[tenant]
  }

  payload.logger.info(`— Seeding brand media...`)

  const logoFiles: Record<string, string> = {
    bac: 'BAC.png',
    btac: 'BTAC.png',
    caic: 'CAIC.jpg',
    cbac: 'CBAC.png',
    cnfaic: 'CNFAIC.png',
    coaa: 'COAA.png',
    esac: 'ESAC.png',
    fac: 'FAC.png',
    gnfac: 'GNFAC.png',
    hpac: 'HPAC.png',
    ipac: 'IPAC.png',
    kpac: 'KPAC.png',
    msac: 'MSAC.png',
    mwac: 'MWAC.png',
    nwac: 'NWAC.png',
    pac: 'PAC.png',
    sac: 'SAC.png',
    snfac: 'SNFAC.png',
    tac: 'TAC.png',
    wac: 'WAC.png',
    wcmac: 'WCMAC.png',
  }
  const bannerFiles: Record<string, string> = {
    nwac: 'https://files.nwac.us/wp-content/uploads/2020/10/08140810/nwac-logo-usfs.png',
    sac: 'https://tahoe.com/sites/default/files/styles/medium/public/business/1900/logo/sac-png-logo.png',
    snfac: 'https://www.sawtoothavalanche.com/wp-content/uploads/2019/01/sac-usfs-logo.png',
  }
  const logos: Record<string, File> = {}
  const banners: Record<string, File> = {}
  for (const tenantSlug in tenants) {
    if (tenantSlug in logoFiles) {
      const logo = await fetchFileByURL(
        'https://raw.githubusercontent.com/NWACus/avy/refs/heads/main/assets/logos/' +
          logoFiles[tenantSlug],
      )
      if (!logo) {
        throw new Error(`Downloading logo for tenant ${tenantSlug} returned null...`)
      }
      logos[tenantSlug] = logo
    }
    if (tenantSlug in bannerFiles) {
      const banner = await fetchFileByURL(bannerFiles[tenantSlug])
      if (!banner) {
        throw new Error(`Downloading banner for tenant ${tenantSlug} returned null...`)
      }
      banners[tenantSlug] = banner
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
            alt: 'banner',
          },
          file: banners[tenant.slug],
        },
      ])
      .flat(),
  ])

  const themesByTenant: Record<string, string> = {
    nwac: 'Zinc',
    sac: 'Blue',
    snfac: 'Zinc',
  }
  // Brands
  await upsert(
    'brands',
    payload,
    incremental,
    tenantsById,
    (obj) => (typeof obj.tenant === 'object' ? obj.tenant.slug : 'UNKNOWN'),
    Object.values(tenants).map(
      (tenant): RequiredDataFromCollectionSlug<'brands'> => ({
        tenant: tenant.id,
        logo: brandImages[tenant.slug]['logo'].id,
        banner: brandImages[tenant.slug]['banner'].id,
        theme: themes[themesByTenant[tenant.slug]].id,
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
  const users = await upsertGlobals('users', payload, incremental, (obj) => obj.name, [
    {
      name: 'Super Admin',
      email: 'admin@avy.com',
      password: password,
    },
    ...Object.values(tenants)
      .map((tenant): RequiredDataFromCollectionSlug<'users'>[] => [
        {
          name: tenant.slug.toUpperCase() + ' Admin',
          email: 'admin@' + (tenant.domains as NonNullable<Tenant['domains']>)[0].domain,
          password: password,
        },
        {
          name: tenant.slug.toUpperCase() + ' Contributor',
          email: 'contributor@' + (tenant.domains as NonNullable<Tenant['domains']>)[0].domain,
          password: password,
        },
        {
          name: tenant.slug.toUpperCase() + ' Viewer',
          email: 'viewer@' + (tenant.domains as NonNullable<Tenant['domains']>)[0].domain,
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
      roles: [roles['Admin'].id],
      user: users['Super Admin'].id,
    },
  ]
  if (user && user.email !== users['Super Admin'].email) {
    globalRoleAssignments.push({
      roles: [roles['Admin'].id],
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
            roles: [roles['Contributor'].id],
            user: users[tenant.slug.toUpperCase() + ' Contributor'].id,
          },

          {
            tenant: tenant.id,
            roles: [roles['Viewer'].id],
            user: users[tenant.slug.toUpperCase() + ' Viewer'].id,
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

  payload.logger.info(`— Fetching images...`)

  const [image1Buffer, image2Buffer, image3Buffer, imageMountainBuffer] = await Promise.all([
    fetchFileByURL(
      'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/website/src/endpoints/seed/image-post1.webp',
    ),
    fetchFileByURL(
      'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/website/src/endpoints/seed/image-post2.webp',
    ),
    fetchFileByURL(
      'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/website/src/endpoints/seed/image-post3.webp',
    ),
    fetchFileByURL(
      'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/website/src/endpoints/seed/image-post3.webp',
    ),
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

  const posts = await upsert(
    'posts',
    payload,
    incremental,
    tenantsById,
    (obj) => obj.slug,
    Object.values(tenants)
      .map((tenant): RequiredDataFromCollectionSlug<'posts'>[] => [
        post1(
          tenant,
          images[tenant.slug]['image1'],
          images[tenant.slug]['image2'],
          users[tenant.slug.toUpperCase() + ' Contributor'],
        ),
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
          users[tenant.slug.toUpperCase() + ' Contributor'],
        ),
      ])
      .flat(),
  )

  payload.logger.info(`— Updating post relationships...`)
  for (const tenant in posts) {
    for (const title in posts[tenant]) {
      const post = posts[tenant][title]
      payload.logger.info(
        `Updating posts['${tenantsById[typeof post.tenant === 'number' ? post.tenant : post.tenant.id].slug}']['${post.slug}']...`,
      )
      await payload.update({
        id: post.id,
        collection: 'posts',
        data: {
          relatedPosts: Object.values(posts[tenant])
            .filter((p) => p.id !== post.id)
            .map((p) => p.id),
        },
      })
    }
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

  payload.logger.info(`— Seeding globals...`)

  await Promise.all([
    payload.updateGlobal({
      slug: 'footer',
      data: {
        navItems: [
          {
            link: {
              type: 'custom',
              label: 'Admin',
              url: '/admin',
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Source Code',
              newTab: true,
              url: 'https://github.com/payloadcms/payload/tree/main/templates/website',
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Payload',
              newTab: true,
              url: 'https://payloadcms.com/',
            },
          },
        ],
      },
    }),
  ])

  payload.logger.info('Seeded database successfully!')
}
