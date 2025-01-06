import type { CollectionSlug, GlobalSlug, Payload, PayloadRequest, File } from 'payload'

import { contactForm as contactFormData } from './contact-form'
import { contact as contactPageData } from './contact-page'
import { home } from './home'
import { image1 } from './image-1'
import { image2 } from './image-2'
import { imageHero1 } from './image-hero-1'
import { post1 } from './post-1'
import { post2 } from './post-2'
import { post3 } from './post-3'

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
  'tenants'
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
  ).catch(payload.logger.error)

  await Promise.all(
    collections
      .filter((collection) => Boolean(payload.collections[collection].config.versions))
      .map((collection) => payload.db.deleteVersions({ collection, req, where: {} })),
  ).catch(payload.logger.error)

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

  const everythingRole = await payload
    .create({
      collection: 'roles',
      data: {
        name: 'Admin',
        rules: [
          {
            collections: ['*'],
            actions: ['*'],
          },
        ],
      },
    })
    .catch(payload.logger.error)

  if (!everythingRole) {
    payload.logger.error('Creating everythingRole returned null...')
    return
  }

  const userAdministratorRole = await payload
    .create({
      collection: 'roles',
      data: {
        name: 'User Administrator',
        rules: [
          {
            collections: ['roleAssignments'],
            actions: ['create', 'update'],
          },
        ],
      },
    })
    .catch(payload.logger.error)

  if (!userAdministratorRole) {
    payload.logger.error('Creating userAdministratorRole returned null...')
    return
  }

  const contributorRole = await payload
    .create({
      collection: 'roles',
      data: {
        name: 'Contributor',
        rules: [
          {
            collections: ['posts', 'pages', 'categories', 'media'],
            actions: ['create', 'update'],
          },
        ],
      },
    })
    .catch(payload.logger.error)

  if (!contributorRole) {
    payload.logger.error('Creating contributorRole returned null...')
    return
  }

  const viewerRole = await payload
    .create({
      collection: 'roles',
      data: {
        name: 'Viewer',
        rules: [
          {
            collections: ['*'],
            actions: ['read'],
          },
        ],
      },
    })
    .catch(payload.logger.error)

  if (!viewerRole) {
    payload.logger.error('Creating viewerRole returned null...')
    return
  }

  payload.logger.info(`— Seeding tenants...`)

  const nwacTenant = await payload
    .create({
      collection: 'tenants',
      data: {
        name: 'Northwest Avalanche Center',
        slug: 'nwac',
        domains: [{ domain: 'nwac.us' }],
      },
    })
    .catch(payload.logger.error)

  if (!nwacTenant) {
    payload.logger.error('Creating NWAC tenant returned null...')
    return
  }

  const sacTenant = await payload
    .create({
      collection: 'tenants',
      data: {
        name: 'Sierra Avalanche Center',
        slug: 'sac',
        domains: [{ domain: 'sierraavalanchecenter.org' }],
      },
    })
    .catch(payload.logger.error)

  if (!sacTenant) {
    payload.logger.error('Creating NWAC tenant returned null...')
    return
  }

  payload.logger.info(`— Seeding users...`)

  const superAdmin = await payload
    .create({
      collection: 'users',
      data: {
        name: 'Super Admin',
        email: 'admin@avy.com',
        password: 'password',
      },
    })
    .catch(payload.logger.error)

  if (!superAdmin) {
    payload.logger.error('Creating super admin returned null...')
    return
  }

  const nwacAdmin = await payload
    .create({
      collection: 'users',
      data: {
        name: 'NWAC Admin',
        email: 'admin@nwac.us',
        password: 'password',
      },
    })
    .catch(payload.logger.error)

  if (!nwacAdmin) {
    payload.logger.error('Creating NWAC admin returned null...')
    return
  }

  const nwacEditor = await payload
    .create({
      collection: 'users',
      data: {
        name: 'NWAC Editor',
        email: 'editor@nwac.us',
        password: 'password',
      },
    })
    .catch(payload.logger.error)

  if (!nwacEditor) {
    payload.logger.error('Creating NWAC nwacEditor null...')
    return
  }

  const nwacViewer = await payload
    .create({
      collection: 'users',
      data: {
        name: 'NWAC Viewer',
        email: 'viewer@nwac.us',
        password: 'password',
      },
    })
    .catch(payload.logger.error)

  if (!nwacViewer) {
    payload.logger.error('Creating NWAC nwacViewer null...')
    return
  }

  const sacAdmin = await payload
    .create({
      collection: 'users',
      data: {
        name: 'SAC Admin',
        email: 'admin@sierraavalanche.org',
        password: 'password',
      },
    })
    .catch(payload.logger.error)

  if (!sacAdmin) {
    payload.logger.error('sacAdmin admin returned null...')
    return
  }

  const sacEditor = await payload
    .create({
      collection: 'users',
      data: {
        name: 'SAC Editor',
        email: 'editor@sierraavalanche.org',
        password: 'password',
      },
    })
    .catch(payload.logger.error)

  if (!sacEditor) {
    payload.logger.error('Creating sacEditor returned null...')
    return
  }

  const sacViewer = await payload
    .create({
      collection: 'users',
      data: {
        name: 'SAC Viewer',
        email: 'viewer@sierraavalanche.org',
        password: 'password',
      },
    })
    .catch(payload.logger.error)

  if (!sacViewer) {
    payload.logger.error('Creating sacViewer returned null...')
    return
  }

  payload.logger.info(`— Seeding global role assignments...`)

  const superAdminRoleAssignment = await payload
    .create({
      collection: 'globalRoleAssignments',
      data: {
        roles: [everythingRole],
        user: superAdmin,
      },
    })
    .catch(payload.logger.error)

  payload.logger.info(`— Seeding tenant role assignments...`)

  const nwacAdminRoleAssignment = await payload
    .create({
      collection: 'roleAssignments',
      data: {
        tenant: nwacTenant,
        roles: [everythingRole],
        user: nwacAdmin,
      },
    })
    .catch(payload.logger.error)

  const nwacEditorRoleAssignment = await payload
    .create({
      collection: 'roleAssignments',
      data: {
        tenant: nwacTenant,
        roles: [contributorRole, viewerRole],
        user: nwacEditor,
      },
    })
    .catch(payload.logger.error)

  const nwacViewerRoleAssignment = await payload
    .create({
      collection: 'roleAssignments',
      data: {
        tenant: nwacTenant,
        roles: [viewerRole],
        user: nwacViewer,
      },
    })
    .catch(payload.logger.error)

  const sacAdminRoleAssignment = await payload
    .create({
      collection: 'roleAssignments',
      data: {
        tenant: sacTenant,
        roles: [everythingRole],
        user: sacAdmin,
      },
    })
    .catch(payload.logger.error)

  const sacEditorRoleAssignment = await payload
    .create({
      collection: 'roleAssignments',
      data: {
        tenant: sacTenant,
        roles: [contributorRole, viewerRole],
        user: sacEditor,
      },
    })
    .catch(payload.logger.error)

  const sacViewerRoleAssignment = await payload
    .create({
      collection: 'roleAssignments',
      data: {
        tenant: sacTenant,
        roles: [viewerRole],
        user: sacViewer,
      },
    })
    .catch(payload.logger.error)

  payload.logger.info(`— Seeding collections and categories...`)

  const [
    image1Doc,
    image2Doc,
    image3Doc,
    imageHomeDoc,
    technologyCategory,
    newsCategory,
    financeCategory,
    designCategory,
    softwareCategory,
    engineeringCategory,
  ] = await Promise.all([
    payload.create({
      collection: 'media',
      data: image1,
      file: image1Buffer,
    }),
    payload.create({
      collection: 'media',
      data: image2,
      file: image2Buffer,
    }),
    payload.create({
      collection: 'media',
      data: image2,
      file: image3Buffer,
    }),
    payload.create({
      collection: 'media',
      data: imageHero1,
      file: hero1Buffer,
    }),

    payload.create({
      collection: 'categories',
      data: {
        title: 'Technology',
        tenant: nwacTenant,
      },
    }),

    payload.create({
      collection: 'categories',
      data: {
        title: 'News',
        tenant: nwacTenant,
      },
    }),

    payload.create({
      collection: 'categories',
      data: {
        title: 'Finance',
        tenant: nwacTenant,
      },
    }),
    payload.create({
      collection: 'categories',
      data: {
        title: 'Design',
        tenant: sacTenant,
      },
    }),

    payload.create({
      collection: 'categories',
      data: {
        title: 'Software',
        tenant: sacTenant,
      },
    }),

    payload.create({
      collection: 'categories',
      data: {
        title: 'Engineering',
        tenant: sacTenant,
      },
    }),
  ])

  let demoAuthorID: number | string = nwacAdmin.id

  let image1ID: number | string = image1Doc.id
  let image2ID: number | string = image2Doc.id
  let image3ID: number | string = image3Doc.id
  let imageHomeID: number | string = imageHomeDoc.id

  if (payload.db.defaultIDType === 'text') {
    image1ID = `"${image1Doc.id}"`
    image2ID = `"${image2Doc.id}"`
    image3ID = `"${image3Doc.id}"`
    imageHomeID = `"${imageHomeDoc.id}"`
    demoAuthorID = `"${demoAuthorID}"`
  }

  payload.logger.info(`— Seeding posts...`)

  // Do not create posts with `Promise.all` because we want the posts to be created in order
  // This way we can sort them by `createdAt` or `publishedAt` and they will be in the expected order
  const post1Doc = await payload.create({
    collection: 'posts',
    depth: 0,
    context: {
      disableRevalidate: true,
    },
    data: JSON.parse(
      JSON.stringify({ ...post1, categories: [technologyCategory.id] })
        .replace(/"\{\{IMAGE_1\}\}"/g, String(image1ID))
        .replace(/"\{\{IMAGE_2\}\}"/g, String(image2ID))
        .replace(/"\{\{AUTHOR\}\}"/g, String(demoAuthorID))
        .replace(/"\{\{TENANT_ID\}\}"/g, String(nwacTenant.id)),
    ),
  })

  const post2Doc = await payload.create({
    collection: 'posts',
    depth: 0,
    context: {
      disableRevalidate: true,
    },
    data: JSON.parse(
      JSON.stringify({ ...post2, categories: [newsCategory.id] })
        .replace(/"\{\{IMAGE_1\}\}"/g, String(image2ID))
        .replace(/"\{\{IMAGE_2\}\}"/g, String(image3ID))
        .replace(/"\{\{AUTHOR\}\}"/g, String(demoAuthorID))
        .replace(/"\{\{TENANT_ID\}\}"/g, String(nwacTenant.id)),
    ),
  })

  const post3Doc = await payload.create({
    collection: 'posts',
    depth: 0,
    context: {
      disableRevalidate: true,
    },
    data: JSON.parse(
      JSON.stringify({ ...post3, categories: [financeCategory.id] })
        .replace(/"\{\{IMAGE_1\}\}"/g, String(image3ID))
        .replace(/"\{\{IMAGE_2\}\}"/g, String(image1ID))
        .replace(/"\{\{AUTHOR\}\}"/g, String(demoAuthorID))
        .replace(/"\{\{TENANT_ID\}\}"/g, String(nwacTenant.id)),
    ),
  })

  // update each post with related posts
  await payload.update({
    id: post1Doc.id,
    collection: 'posts',
    data: {
      relatedPosts: [post2Doc.id, post3Doc.id],
    },
  })
  await payload.update({
    id: post2Doc.id,
    collection: 'posts',
    data: {
      relatedPosts: [post1Doc.id, post3Doc.id],
    },
  })
  await payload.update({
    id: post3Doc.id,
    collection: 'posts',
    data: {
      relatedPosts: [post1Doc.id, post2Doc.id],
    },
  })

  payload.logger.info(`— Seeding contact form...`)

  const contactForm = await payload.create({
    collection: 'forms',
    depth: 0,
    data: JSON.parse(JSON.stringify(contactFormData)),
  })

  let contactFormID: number | string = contactForm.id

  if (payload.db.defaultIDType === 'text') {
    contactFormID = `"${contactFormID}"`
  }

  payload.logger.info(`— Seeding pages...`)

  const [_, contactPage] = await Promise.all([
    payload.create({
      collection: 'pages',
      depth: 0,
      data: JSON.parse(
        JSON.stringify(home)
          .replace(/"\{\{IMAGE_1\}\}"/g, String(imageHomeID))
          .replace(/"\{\{IMAGE_2\}\}"/g, String(image2ID))
          .replace(/"\{\{TENANT_ID\}\}"/g, String(nwacTenant.id)),
      ),
    }),
    payload.create({
      collection: 'pages',
      depth: 0,
      data: JSON.parse(
        JSON.stringify(contactPageData)
          .replace(/"\{\{CONTACT_FORM_ID\}\}"/g, String(contactFormID))
          .replace(/"\{\{TENANT_ID\}\}"/g, String(nwacTenant.id)),
      ),
    }),
  ])

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
          {
            link: {
              type: 'reference',
              label: 'Contact',
              reference: {
                relationTo: 'pages',
                value: contactPage.id,
              },
            },
          },
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
