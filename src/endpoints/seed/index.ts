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
import { Category, Media, Page, Post, Role, RoleAssignment, Tenant, User } from '@/payload-types'

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
          email: 'admin@' + tenant.domains![0].domain,
          password: 'password',
        },
        {
          name: tenant.slug.toUpperCase() + ' Contributor',
          email: 'contributor@' + tenant.domains![0].domain,
          password: 'password',
        },
        {
          name: tenant.slug.toUpperCase() + ' Viewer',
          email: 'viewer@' + tenant.domains![0].domain,
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

  const superAdminRoleAssignment = await payload
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
      `Assigning ${(data.user! as User).name} role ${(data.roles! as Role[])[0].name} in ${(data.tenant! as Tenant).name}...`,
    )
    const roleAssignment = await payload
      .create({
        collection: 'roleAssignments',
        data: data,
      })
      .catch((e) => payload.logger.error(e))

    if (!roleAssignment) {
      payload.logger.error(
        `Assigning ${(data.user! as User).name} role ${(data.roles! as Role[])[0].name} in ${(data.tenant! as Tenant).name} returned null...`,
      )
      return
    }
  }

  payload.logger.info(`— Seeding media...`)

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
      `Creating media ${data.data.alt! as string} for tenant ${(data.data.tenant! as Tenant).name}...`,
    )
    const image = await payload
      .create({
        collection: 'media',
        data: data.data,
        file: data.file,
      })
      .catch((e) => payload.logger.error(e))

    if (!image) {
      payload.logger.error(
        `Creating media ${data.data.alt! as string} for tenant ${(data.data.tenant! as Tenant).name} returned null...`,
      )
      return
    }
    if (!((data.data.tenant! as Tenant).name in images)) {
      images[(data.data.tenant! as Tenant).name] = {}
    }
    images[(data.data.tenant! as Tenant).name][data.name] = image
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
      `Creating category ${data.title} for tenant ${(data.tenant! as Tenant).name}...`,
    )
    const category = await payload
      .create({
        collection: 'categories',
        data: data,
      })
      .catch((e) => payload.logger.error(e))

    if (!category) {
      payload.logger.error(
        `Creating category ${data.title} for tenant ${(data.tenant! as Tenant).name} returned null...`,
      )
      return
    }
    if (!((data.tenant! as Tenant).name in categories)) {
      categories[(data.tenant! as Tenant).name] = {}
    }
    categories[(data.tenant! as Tenant).name][data.title] = category
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
      `Creating post ${data.name} for tenant ${(data.data.tenant! as Tenant).name}...`,
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
        `Creating post ${data.name} for tenant ${(data.data.tenant! as Tenant).name} returned null...`,
      )
      return
    }
    if (!((data.data.tenant! as Tenant).name in posts)) {
      posts[(data.data.tenant! as Tenant).name] = {}
    }
    posts[(data.data.tenant! as Tenant).name][data.name] = post
  }

  payload.logger.info(`— Updating post relationships...`)

  for (const data of Object.values(posts)) {
    const posts = Object.values(data) as Post[]
    for (let i = 0; i < posts.length; i++) {
      payload.logger.info(
        `Updating post ${posts[i].id} for tenant ${(posts[i].tenant! as Tenant).name}...`,
      )
      await payload
        .update({
          id: posts[i].id,
          collection: 'posts',
          data: {
            relatedPosts: posts.filter((post) => post.id !== posts[i].id).map((post) => post.id),
          },
        })
        .catch((e) => payload.logger.error)
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
      ])
      .flat(),
  ]
  const pages: Record<string, Record<string, Page>> = {}
  for (const data of pageData) {
    payload.logger.info(
      `Creating page ${data.slug} for tenant ${(data.tenant! as Tenant).name}...`,
    )
    const page = await payload
      .create({
        collection: 'pages',
        depth: 0,
        data: data,
      })
      .catch((e) => payload.logger.error(e))

    if (!page) {
      payload.logger.error(
        `Creating page ${data.slug} for tenant ${(data.tenant! as Tenant).name} returned null...`,
      )
      return
    }
    if (!((data.tenant! as Tenant).name in pages)) {
      pages[(data.tenant! as Tenant).name] = {}
    }
    pages[(data.tenant! as Tenant).name][data.slug] = page
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
