import { getCanonicalUrlForPath } from '@/components/Header/utils'
import { resolveTenant } from '@/utilities/tenancy/resolveTenant'
import { FieldHook } from 'payload'
import invariant from 'tiny-invariant'

export const validateFrom: FieldHook = async ({ value, data, req: { payload } }) => {
  const tenantId = data?.tenant

  invariant(typeof value === 'string', 'From URL is invalid.')
  invariant(typeof tenantId === 'number', 'Tenant not selected.')

  /** ensure from URL is unique across the same tenant */

  const { docs: existingRedirects } = await payload.find({
    collection: 'redirects',
    depth: 0,
    limit: 1,
    pagination: false,
    where: {
      from: {
        equals: value,
      },
      tenant: {
        equals: tenantId,
      },
    },
  })

  if (existingRedirects.length > 0) {
    throw new Error('From URL must be unique.')
  }

  /** ensure from URL does not match a published page or post path */

  if (value.split('/').slice(1).length === 1) {
    // matches a page slug
    const { docs: matchingPages } = await payload.find({
      collection: 'pages',
      depth: 0,
      limit: 1,
      pagination: false,
      where: {
        _status: {
          equals: 'published',
        },
        tenant: {
          equals: tenantId,
        },
        slug: {
          equals: value.split('/').pop(),
        },
      },
      select: {
        slug: true,
        title: true,
      },
    })

    if (matchingPages.length > 0) {
      throw new Error(`This From URL matches a published page: ${matchingPages[0].title}`)
    }
  } else {
    // check canonical URLs

    const tenant = await resolveTenant(tenantId)
    const canonicalUrl = await getCanonicalUrlForPath(tenant.slug, value)

    if (canonicalUrl) {
      const { docs: matchingPages } = await payload.find({
        collection: 'pages',
        depth: 0,
        limit: 1,
        pagination: false,
        where: {
          _status: {
            equals: 'published',
          },
          tenant: {
            equals: tenantId,
          },
          slug: {
            equals: value.split('/').pop(),
          },
        },
        select: {
          slug: true,
          title: true,
        },
      })

      if (matchingPages.length > 0) {
        throw new Error(
          `This From URL matches a published page nested in the navigation: ${matchingPages[0].title}`,
        )
      }
    }
  }

  if (value.startsWith('/blog/')) {
    // check posts

    const { docs: matchingPosts } = await payload.find({
      collection: 'posts',
      depth: 0,
      limit: 1,
      pagination: false,
      where: {
        _status: {
          equals: 'published',
        },
        tenant: {
          equals: tenantId,
        },
        slug: {
          equals: value.split('/blog/').pop(),
        },
      },
      select: {
        slug: true,
        title: true,
      },
    })

    if (matchingPosts.length > 0) {
      throw new Error(`This From URL matches a published post: ${matchingPosts[0].title}`)
    }
  }

  return value
}
