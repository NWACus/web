import type {
  CollectionSlug,
  GlobalSlug,
  Payload,
  PayloadRequest,
  File,
  RequiredDataFromCollectionSlug,
} from 'payload'

import { contactForm as contactFormData } from './contact-form'
import { contact as contactPageData } from './contact-page'
import { home } from './home'
import { image1 } from './image-1'
import { image2 } from './image-2'
import { imageHero1 } from './image-hero-1'
import { post1 } from './post-1'
import { post2 } from './post-2'
import { post3 } from './post-3'
import {
  Brand,
  Category,
  Media,
  NavigationGroup,
  NavigationSection,
  Page,
  Palette,
  Post,
  Role,
  Tenant,
  Theme,
  User,
} from '@/payload-types'
import { page } from '@/endpoints/seed/page'
import { formatSlug } from '@/fields/slug/formatSlug'

const collections: CollectionSlug[] = [
  'categories',
  'media',
  'pages',
  'posts',
  'forms',
  'form-submissions',
  'search',
  'roles',
  'globalRoleAssignments',
  'roleAssignments',
  'tenants',
]
const globals: GlobalSlug[] = ['header', 'footer']

// Next.js revalidation errors are normal when seeding the database without a server running
// i.e. running `yarn seed` locally instead of using the admin UI within an active app
// The app is not running to revalidate the pages and so the API routes are not available
// These error messages can be ignored: `Error hitting revalidate route for...`
export const seed = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<void> => {
  try {
    await innerSeed({ payload, req })
  } catch (error) {
    payload.logger.error(error)
  }
}

export const innerSeed = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<void> => {
  payload.logger.info('Seeding database...')

  // we need to clear the media directory before seeding
  // as well as the collections and globals
  // this is because while `yarn seed` drops the database
  // the custom `/api/seed` endpoint does not
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
    collections.map((collection) => payload.db.deleteMany({ collection, req, where: {} })),
  ).catch((e) => payload.logger.error(e))

  await Promise.all(
    collections
      .filter((collection) => Boolean(payload.collections[collection].config.versions))
      .map((collection) => payload.db.deleteVersions({ collection, req, where: {} })),
  ).catch((e) => payload.logger.error(e))

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
      ],
    },
  })

  payload.logger.info(`— Seeding palettes...`)

  // https://github.com/shadcn-ui/ui/blob/1081536246b44b6664f4c99bc3f1b3614e632841/apps/www/registry/registry-base-colors.ts
  const paletteData: RequiredDataFromCollectionSlug<'palettes'>[] = [
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
  ]
  const palettes: Record<string, Palette> = {}
  for (const data of paletteData) {
    payload.logger.info(`Creating ${data.name} palette...`)
    const palette = await payload
      .create({
        collection: 'palettes',
        data: data,
      })
      .catch((e) => payload.logger.error(e))

    if (!palette) {
      payload.logger.error(`Creating ${data.name} palette returned null...`)
      return
    }
    palettes[data.name] = palette
  }

  payload.logger.info(`— Seeding themes...`)

  const themeData: RequiredDataFromCollectionSlug<'themes'>[] = [
    {
      name: 'Zinc',
      activeColors: {
        light: '240 5.9% 10%',
        dark: '240 5.2% 33.9%',
      },
      palettes: {
        light: palettes['Zinc Light'],
        dark: palettes['Zinc Dark'],
      },
    },
    {
      name: 'Blue',
      activeColors: {
        light: '221.2 83.2% 53.3%',
        dark: '217.2 91.2% 59.8%',
      },
      palettes: {
        light: palettes['Blue Light'],
        dark: palettes['Blue Dark'],
      },
    },
  ]
  const themes: Record<string, Theme> = {}
  for (const data of themeData) {
    payload.logger.info(`Creating ${data.name} theme...`)
    const theme = await payload
      .create({
        collection: 'themes',
        data: data,
      })
      .catch((e) => payload.logger.error(e))

    if (!theme) {
      payload.logger.error(`Creating ${data.name} theme returned null...`)
      return
    }
    themes[data.name] = theme
  }

  payload.logger.info(`— Seeding roles...`)

  const roleData: RequiredDataFromCollectionSlug<'roles'>[] = [
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
          actions: ['create', 'update'],
        },
      ],
    },
    {
      name: 'Contributor',
      rules: [
        {
          collections: ['posts', 'pages', 'categories', 'media'],
          actions: ['create', 'update'],
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
  ]
  const roles: Record<string, Role> = {}
  for (const data of roleData) {
    payload.logger.info(`Creating ${data.name} role...`)
    const role = await payload
      .create({
        collection: 'roles',
        data: data,
      })
      .catch((e) => payload.logger.error(e))

    if (!role) {
      payload.logger.error(`Creating ${data.name} role returned null...`)
      return
    }
    roles[data.name] = role
  }

  payload.logger.info(`— Seeding tenants...`)

  const tenantData: RequiredDataFromCollectionSlug<'tenants'>[] = [
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
  ]
  const tenants: Record<string, Tenant> = {}
  for (const data of tenantData) {
    payload.logger.info(`Creating ${data.name} tenant returned...`)
    const tenant = await payload
      .create({
        collection: 'tenants',
        data: data,
      })
      .catch((e) => payload.logger.error(e))

    if (!tenant) {
      payload.logger.error(`Creating ${data.name} tenant returned null...`)
      return
    }
    tenants[data.slug] = tenant
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
  }
  const logos: Record<string, File> = {}
  const banners: Record<string, File> = {}
  for (const tenant of tenantData) {
    if (tenant.slug in logoFiles) {
      const logo = await fetchFileByURL(
        'https://raw.githubusercontent.com/NWACus/avy/refs/heads/main/assets/logos/' +
          logoFiles[tenant.slug],
      ).catch((e) => payload.logger.error(e))
      if (!logo) {
        payload.logger.error(`Downloading logo for tenant ${tenant.slug} returned null...`)
        return
      }
      logos[tenant.slug] = logo
    }
    if (tenant.slug in bannerFiles) {
      const banner = await fetchFileByURL(bannerFiles[tenant.slug]).catch((e) =>
        payload.logger.error(e),
      )
      if (!banner) {
        payload.logger.error(`Downloading banner for tenant ${tenant.slug} returned null...`)
        return
      }
      banners[tenant.slug] = banner
    }
  }

  type brandImageData = { name: string; data: RequiredDataFromCollectionSlug<'media'>; file: File }
  const brandImageData: brandImageData[] = [
    ...Object.values(tenants)
      .map((tenant): brandImageData[] => [
        {
          name: 'logo',
          data: {
            tenant: tenant,
            alt: 'logo',
          },
          file: logos[tenant.slug],
        },
        {
          name: 'banner',
          data: {
            tenant: tenant,
            alt: 'banner',
          },
          file: banners[tenant.slug],
        },
      ])
      .flat(),
  ]
  const brandImages: Record<string, Record<string, Media>> = {}
  for (const data of brandImageData) {
    payload.logger.info(
      `Creating brand media ${data.name} for tenant ${(data.data.tenant as Tenant).name}...`,
    )
    data.file.name = (data.data.tenant as Tenant).slug + '-' + data.file.name
    const image = await payload
      .create({
        collection: 'media',
        data: data.data,
        file: data.file,
      })
      .catch((e) => payload.logger.error(e))

    if (!image) {
      payload.logger.error(
        `Creating brand media ${data.name} for tenant ${(data.data.tenant as Tenant).name} returned null...`,
      )
      return
    }
    if (!((data.data.tenant as Tenant).name in brandImages)) {
      brandImages[(data.data.tenant as Tenant).name] = {}
    }
    brandImages[(data.data.tenant as Tenant).name][data.name] = image
  }

  payload.logger.info(`— Seeding brands...`)

  const themesByTenant: Record<string, string> = {
    nwac: 'Zinc',
    sac: 'Blue',
  }

  const brandData: RequiredDataFromCollectionSlug<'brands'>[] = [
    ...Object.values(tenants).map(
      (tenant): RequiredDataFromCollectionSlug<'brands'> => ({
        tenant: tenant,
        logo: brandImages[tenant.name]['logo'],
        banner: brandImages[tenant.name]['banner'],
        theme: themes[themesByTenant[tenant.slug]],
      }),
    ),
  ]
  const brands: Record<string, Brand> = {}
  for (const data of brandData) {
    payload.logger.info(`Creating ${(data.tenant as Tenant).name} brand...`)
    const brand = await payload
      .create({
        collection: 'brands',
        data: data,
      })
      .catch((e) => payload.logger.error(e))

    if (!brand) {
      payload.logger.error(`Creating ${(data.tenant as Tenant).name} brand returned null...`)
      return
    }
    brands[(data.tenant as Tenant).name] = brand
  }

  payload.logger.info(`— Seeding users...`)

  const userData: RequiredDataFromCollectionSlug<'users'>[] = [
    {
      name: 'Super Admin',
      email: 'admin@avy.com',
      password: 'password',
    },
    ...Object.values(tenants)
      .map((tenant): RequiredDataFromCollectionSlug<'users'>[] => [
        {
          name: tenant.slug.toUpperCase() + ' Admin',
          email: 'admin@' + (tenant.domains as NonNullable<Tenant['domains']>)[0].domain,
          password: 'password',
        },
        {
          name: tenant.slug.toUpperCase() + ' Contributor',
          email: 'contributor@' + (tenant.domains as NonNullable<Tenant['domains']>)[0].domain,
          password: 'password',
        },
        {
          name: tenant.slug.toUpperCase() + ' Viewer',
          email: 'viewer@' + (tenant.domains as NonNullable<Tenant['domains']>)[0].domain,
          password: 'password',
        },
      ])
      .flat(),
  ]
  const users: Record<string, User> = {}
  for (const data of userData) {
    payload.logger.info(`Creating ${data.name} user...`)
    const user = await payload
      .create({
        collection: 'users',
        data: data,
      })
      .catch((e) => payload.logger.error(e))

    if (!user) {
      payload.logger.error(`Creating ${data.name} user returned null...`)
      return
    }
    users[data.name] = user
  }

  payload.logger.info(`— Seeding global role assignments...`)

  const _superAdminRoleAssignment = await payload
    .create({
      collection: 'globalRoleAssignments',
      data: {
        roles: [roles['Admin']],
        user: users['Super Admin'],
      },
    })
    .catch((e) => payload.logger.error(e))

  payload.logger.info(`— Seeding tenant role assignments...`)

  const roleAssignmentData: RequiredDataFromCollectionSlug<'roleAssignments'>[] = [
    ...Object.values(tenants)
      .map((tenant): RequiredDataFromCollectionSlug<'roleAssignments'>[] => [
        {
          tenant: tenant,
          roles: [roles['Admin']],
          user: users[tenant.slug.toUpperCase() + ' Admin'],
        },
        {
          tenant: tenant,
          roles: [roles['Contributor']],
          user: users[tenant.slug.toUpperCase() + ' Contributor'],
        },

        {
          tenant: tenant,
          roles: [roles['Viewer']],
          user: users[tenant.slug.toUpperCase() + ' Viewer'],
        },
      ])
      .flat(),
  ]
  for (const data of roleAssignmentData) {
    payload.logger.info(
      `Assigning ${(data.user as User).name} role ${(data.roles as Role[])[0].name} in ${(data.tenant as Tenant).name}...`,
    )
    const roleAssignment = await payload
      .create({
        collection: 'roleAssignments',
        data: data,
      })
      .catch((e) => payload.logger.error(e))

    if (!roleAssignment) {
      payload.logger.error(
        `Assigning ${(data.user as User).name} role ${(data.roles as Role[])[0].name} in ${(data.tenant as Tenant).name} returned null...`,
      )
      return
    }
  }

  payload.logger.info(`— Seeding media...`)

  const [image1Buffer, image2Buffer, image3Buffer, hero1Buffer] = await Promise.all([
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
      'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/website/src/endpoints/seed/image-hero1.webp',
    ),
  ])

  type imageData = { name: string; data: RequiredDataFromCollectionSlug<'media'>; file: File }
  const imageData: imageData[] = [
    ...Object.values(tenants)
      .map((tenant): imageData[] => [
        {
          name: 'image1',
          data: image1(tenant),
          file: image1Buffer,
        },
        {
          name: 'image2',
          data: image2(tenant),
          file: image2Buffer,
        },
        {
          name: 'image3',
          data: image2(tenant),
          file: image3Buffer,
        },
        {
          name: 'home',
          data: imageHero1(tenant),
          file: hero1Buffer,
        },
      ])
      .flat(),
  ]
  const images: Record<string, Record<string, Media>> = {}
  for (const data of imageData) {
    payload.logger.info(
      `Creating media ${data.name} for tenant ${(data.data.tenant as Tenant).name}...`,
    )
    data.file = structuredClone(data.file)
    data.file.name = (data.data.tenant as Tenant).slug + '-' + data.file.name
    const image = await payload
      .create({
        collection: 'media',
        data: data.data,
        file: data.file,
      })
      .catch((e) => payload.logger.error(e))

    if (!image) {
      payload.logger.error(
        `Creating media ${data.name} for tenant ${(data.data.tenant as Tenant).name} returned null...`,
      )
      return
    }
    if (!((data.data.tenant as Tenant).name in images)) {
      images[(data.data.tenant as Tenant).name] = {}
    }
    images[(data.data.tenant as Tenant).name][data.name] = image
  }

  payload.logger.info(`— Seeding categories...`)

  const categoryData: RequiredDataFromCollectionSlug<'categories'>[] = [
    ...Object.values(tenants)
      .map((tenant): RequiredDataFromCollectionSlug<'categories'>[] => [
        {
          title: 'Technology',
          tenant: tenant,
        },
        {
          title: 'News',
          tenant: tenant,
        },
        {
          title: 'Finance',
          tenant: tenant,
        },
        {
          title: 'Design',
          tenant: tenant,
        },
        {
          title: 'Software',
          tenant: tenant,
        },
        {
          title: 'Engineering',
          tenant: tenant,
        },
      ])
      .flat(),
  ]
  const categories: Record<string, Record<string, Category>> = {}
  for (const data of categoryData) {
    payload.logger.info(
      `Creating category ${data.title} for tenant ${(data.tenant as Tenant).name}...`,
    )
    const category = await payload
      .create({
        collection: 'categories',
        data: data,
      })
      .catch((e) => payload.logger.error(e))

    if (!category) {
      payload.logger.error(
        `Creating category ${data.title} for tenant ${(data.tenant as Tenant).name} returned null...`,
      )
      return
    }
    if (!((data.tenant as Tenant).name in categories)) {
      categories[(data.tenant as Tenant).name] = {}
    }
    categories[(data.tenant as Tenant).name][data.title] = category
  }

  payload.logger.info(`— Seeding posts...`)

  type postData = { name: string; data: RequiredDataFromCollectionSlug<'posts'> }
  const postData: postData[] = [
    ...Object.values(tenants)
      .map((tenant): postData[] => [
        {
          name: 'post1',
          data: post1(
            tenant,
            images[tenant.name]['image1'],
            images[tenant.name]['image2'],
            users[tenant.slug.toUpperCase() + ' Contributor'],
          ),
        },
        {
          name: 'post2',
          data: post2(
            tenant,
            images[tenant.name]['image2'],
            images[tenant.name]['image3'],
            users[tenant.slug.toUpperCase() + ' Admin'],
          ),
        },
        {
          name: 'post3',
          data: post3(
            tenant,
            images[tenant.name]['image3'],
            images[tenant.name]['image1'],
            users[tenant.slug.toUpperCase() + ' Contributor'],
          ),
        },
      ])
      .flat(),
  ]
  const posts: Record<string, Record<string, Post>> = {}
  for (const data of postData) {
    payload.logger.info(
      `Creating post ${data.name} for tenant ${(data.data.tenant as Tenant).name}...`,
    )
    const post = await payload
      .create({
        collection: 'posts',
        depth: 0,
        context: {
          disableRevalidate: true,
        },
        data: data.data,
      })
      .catch((e) => payload.logger.error(e))

    if (!post) {
      payload.logger.error(
        `Creating post ${data.name} for tenant ${(data.data.tenant as Tenant).name} returned null...`,
      )
      return
    }
    if (!((data.data.tenant as Tenant).name in posts)) {
      posts[(data.data.tenant as Tenant).name] = {}
    }
    posts[(data.data.tenant as Tenant).name][data.name] = post
  }

  payload.logger.info(`— Updating post relationships...`)

  for (const data of Object.values(posts)) {
    const posts = Object.values(data) as Post[]
    for (let i = 0; i < posts.length; i++) {
      payload.logger.info(
        `Updating post ${posts[i].id} for tenant ${(posts[i].tenant as Tenant).name}...`,
      )
      await payload
        .update({
          id: posts[i].id,
          collection: 'posts',
          data: {
            relatedPosts: posts.filter((post) => post.id !== posts[i].id).map((post) => post.id),
          },
        })
        .catch(() => payload.logger.error)
    }
  }

  payload.logger.info(`— Seeding contact form...`)

  const contactForm = await payload.create({
    collection: 'forms',
    depth: 0,
    data: JSON.parse(JSON.stringify(contactFormData)),
  })

  payload.logger.info(`— Seeding pages...`)

  const pageData: RequiredDataFromCollectionSlug<'pages'>[] = [
    ...Object.values(tenants)
      .map((tenant): RequiredDataFromCollectionSlug<'pages'>[] => [
        home(tenant, images[tenant.name]['home'], images[tenant.name]['image2']),
        contactPageData(tenant, contactForm),
        page(
          tenant,
          images[tenant.name]['home'],
          images[tenant.name]['image2'],
          'Snow Depth Climatology',
          'Determine current snow depths in the context of historical trends.',
          'snow-depth-climatology',
        ),
        page(
          tenant,
          images[tenant.name]['home'],
          images[tenant.name]['image2'],
          'Radar and Satellite Index',
          'Review recent weather radar and satellite weather imagery.',
          'radar-and-satellite-index',
        ),
        page(
          tenant,
          images[tenant.name]['home'],
          images[tenant.name]['image2'],
          'About Us',
          'The avalanche center exists to increase avalanche awareness, reduce avalanche impacts, and equip the community with mountain weather and avalanche forecasts, education, and data.',
          'about-us',
        ),
        page(
          tenant,
          images[tenant.name]['home'],
          images[tenant.name]['image2'],
          'About The Forecasts',
          'The avalanche center produces daily avalanche forecasts across the state during the winter season.',
          'about-the-forecasts',
        ),
        page(
          tenant,
          images[tenant.name]['home'],
          images[tenant.name]['image2'],
          'Avalanche Awareness Classes',
          'The avalanche center offers free avalanche classes to the public throughout our forecast area.',
          'avalanche-awareness-classes',
        ),
        page(
          tenant,
          images[tenant.name]['home'],
          images[tenant.name]['image2'],
          'Courses by Local Providers',
          'Review avalanche safety courses taught by local providers throughout our forecast area.',
          'courses-by-local-providers',
        ),
        page(
          tenant,
          images[tenant.name]['home'],
          images[tenant.name]['image2'],
          'How to Read the Forecast',
          'An explanation of the basic concepts and content in an avalanche forecast, and how to read it.',
          'how-to-read-the-forecast',
        ),
        page(
          tenant,
          images[tenant.name]['home'],
          images[tenant.name]['image2'],
          'Snowpack Scholarship',
          'A scholarship providing free avalanche education to women and individuals with demonstrated financial need.',
          'snowpack-scholarship',
        ),
        page(
          tenant,
          images[tenant.name]['home'],
          images[tenant.name]['image2'],
          'Become a Member',
          'Avalanche center members directly support the forecast you use on every backcountry adventure.',
          'become-a-member',
        ),
        page(
          tenant,
          images[tenant.name]['home'],
          images[tenant.name]['image2'],
          'Volunteer',
          'Interested in volunteering your time for the center? We are always looking for help at events and with various projects.',
          'volunteer',
        ),
        page(
          tenant,
          images[tenant.name]['home'],
          images[tenant.name]['image2'],
          'Workplace Giving',
          'Have you thought about donating to the center through work? Your employer may be able to help you support avalanche safety.',
          'workplace-giving',
        ),
        page(
          tenant,
          images[tenant.name]['home'],
          images[tenant.name]['image2'],
          'Corporate Sponsorships',
          'The avalanche center’s work is supported by the generosity of our industry partners.',
          'corporate-sponsorships',
        ),
      ])
      .flat(),
  ]
  const pages: Record<string, Record<string, Page>> = {}
  for (const data of pageData) {
    payload.logger.info(`Creating page ${data.slug} for tenant ${(data.tenant as Tenant).name}...`)
    const page = await payload
      .create({
        collection: 'pages',
        depth: 0,
        data: data,
      })
      .catch((e) => payload.logger.error(e))

    if (!page) {
      payload.logger.error(
        `Creating page ${data.slug} for tenant ${(data.tenant as Tenant).name} returned null...`,
      )
      return
    }
    if (!((data.tenant as Tenant).name in pages)) {
      pages[(data.tenant as Tenant).name] = {}
    }
    pages[(data.tenant as Tenant).name][data.slug] = page
  }

  payload.logger.info(`— Seeding navigation...`)

  type topLevelNav = {
    name: string
    children: (nav | string)[] // n.b. string is slug of page
  }
  type nav = {
    name: string
    children: string[] // n.b. string is slug of page
  }
  const navigation: topLevelNav[] = [
    {
      name: 'Education',
      children: [
        {
          name: 'Classes',
          children: ['avalanche-awareness-classes', 'courses-by-local-providers'],
        },
        {
          name: 'Documentation',
          children: ['how-to-read-the-forecast'],
        },
      ],
    },
    {
      name: 'Support Us',
      children: [
        'snowpack-scholarship',
        'become-a-member',
        'volunteer',
        'workplace-giving',
        'corporate-sponsorships',
      ],
    },
  ]
  const weather: nav = {
    name: 'Weather Resources',
    children: ['snow-depth-climatology', 'radar-and-satellite-index'],
  }

  const createNavigationGroup = async (tenant: Tenant, group: nav): Promise<NavigationGroup> => {
    payload.logger.info(`Handling navigation group ${group.name} for tenant ${tenant.name}...`)
    const children: RequiredDataFromCollectionSlug<'navigationGroups'>['items'] = []
    for (const child of group.children) {
      children.push({
        relationTo: 'pages',
        value: pages[tenant.name][child].id,
      })
    }
    const data: RequiredDataFromCollectionSlug<'navigationGroups'> = {
      tenant: tenant,
      slug: formatSlug(group.name),
      title: group.name,
      items: children,
    }
    payload.logger.info(`Creating navigation group ${group.name} for tenant ${tenant.name}...`)
    const navigationGroup = await payload
      .create({
        collection: 'navigationGroups',
        depth: 0,
        data: data,
      })
      .catch((e) => payload.logger.error(e))

    if (!navigationGroup) {
      payload.logger.error(
        `Creating navigation group ${group.name} for tenant ${tenant.name} returned null...`,
      )
      throw new Error()
    }
    return navigationGroup
  }
  const createNavigationSection = async (
    tenant: Tenant,
    group: topLevelNav,
  ): Promise<NavigationSection> => {
    payload.logger.info(`Handling navigation section ${group.name} for tenant ${tenant.name}...`)
    const children: RequiredDataFromCollectionSlug<'navigationSections'>['items'] = []
    for (const child of group.children) {
      if (typeof child === 'string') {
        children.push({
          relationTo: 'pages',
          value: pages[tenant.name][child].id,
        })
      } else {
        const ng = await createNavigationGroup(tenant, child)
        children.push({
          relationTo: 'navigationGroups',
          value: ng.id,
        })
      }
    }
    const data: RequiredDataFromCollectionSlug<'navigationSections'> = {
      tenant: tenant,
      slug: formatSlug(group.name),
      title: group.name,
      items: children,
    }
    payload.logger.info(`Creating navigation section ${group.name} for tenant ${tenant.name}...`)
    const navigationSection = await payload
      .create({
        collection: 'navigationSections',
        depth: 0,
        data: data,
      })
      .catch((e) => payload.logger.error(e))

    if (!navigationSection) {
      payload.logger.error(
        `Creating navigation section ${group.name} for tenant ${tenant.name} returned null...`,
      )
      throw new Error()
    }
    return navigationSection
  }

  for (const tenant of Object.values(tenants)) {
    const weatherGroup: NavigationGroup = await createNavigationGroup(tenant, weather)
    const sections: NavigationSection[] = []
    for (const group of navigation) {
      const ng = await createNavigationSection(tenant, group)
      sections.push(ng)
    }
    const data: RequiredDataFromCollectionSlug<'navigations'> = {
      tenant: tenant,
      items: sections.map((section) => ({
        relationTo: 'navigationSections',
        value: section.id,
      })),
      about_us_extra: [
        {
          relationTo: 'pages',
          value: pages[tenant.name]['about-us'].id,
        },
        {
          relationTo: 'pages',
          value: pages[tenant.name]['about-the-forecasts'].id,
        },
      ],
      weather_extra: {
        relationTo: 'navigationGroups',
        value: weatherGroup.id,
      },
    }
    payload.logger.info(`Creating navigation for tenant ${tenant.name}...`)
    const nav = await payload
      .create({
        collection: 'navigations',
        depth: 0,
        data: data,
      })
      .catch((e) => payload.logger.error(e))

    if (!nav) {
      payload.logger.error(`Creating navigation for tenant ${tenant.name} returned null...`)
      throw new Error()
    }
  }

  payload.logger.info(`— Seeding globals...`)

  await Promise.all([
    payload.updateGlobal({
      slug: 'header',
      data: {
        navItems: [
          {
            link: {
              type: 'custom',
              label: 'Posts',
              url: '/posts',
            },
          },
          // {
          //   link: {
          //     type: 'reference',
          //     label: 'Contact',
          //     reference: {
          //       relationTo: 'pages',
          //       value: contactPage.id,
          //     },
          //   },
          // },
        ],
      },
    }),
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

async function fetchFileByURL(url: string): Promise<File> {
  const res = await fetch(url, {
    credentials: 'include',
    method: 'GET',
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch file from ${url}, status: ${res.status}`)
  }

  const data = await res.arrayBuffer()

  return {
    name: url.split('/').pop() || `file-${Date.now()}`,
    data: Buffer.from(data),
    mimetype: `image/${url.split('.').pop()}`,
    size: data.byteLength,
  }
}
