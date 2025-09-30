import { getCanonicalUrlForPath } from '@/components/Header/utils'
import { resolveTenant } from '@/utilities/tenancy/resolveTenant'
import { FieldHook } from 'payload'
import invariant from 'tiny-invariant'
import { z } from 'zod'

const relativeUrlSchema = z
  .string()
  .min(1, 'From URL is required')
  .regex(/^\/[^\s]*$/, 'From URL must be a relative URL starting with "/"')
  .regex(/^\/.*[^/]$/, 'From URL must not have a trailing slash')

export const validateFrom: FieldHook = async ({ value, data, req: { payload } }) => {
  const tenantId = data?.tenant

  invariant(typeof tenantId === 'number', 'Tenant not selected.')

  const validatedValue = relativeUrlSchema.parse(value)

  /** ensure from URL is unique across the same tenant */

  const { docs: existingRedirects } = await payload.find({
    collection: 'redirects',
    depth: 0,
    limit: 1,
    pagination: false,
    where: {
      from: {
        equals: validatedValue,
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

  if (validatedValue.split('/').slice(1).length === 1) {
    // matches a published page slug
    const { docs: matchingPages } = await payload.find({
      collection: 'pages',
      depth: 0,
      limit: 1,
      pagination: false,
      where: {
        tenant: {
          equals: tenantId,
        },
        slug: {
          equals: validatedValue.split('/').pop(),
        },
      },
      select: {
        slug: true,
        title: true,
      },
    })

    if (matchingPages.length > 0) {
      throw new Error(
        `This From URL matches a page "${matchingPages[0].title}". If you want to redirect this From URL please change that page's slug.`,
      )
    }

    // matches a draft page slug
    const { docs: matchingDraftPages } = await payload.find({
      collection: 'pages',
      depth: 0,
      limit: 1,
      pagination: false,
      draft: true,
      where: {
        tenant: {
          equals: tenantId,
        },
        slug: {
          equals: validatedValue.split('/').pop(),
        },
      },
      select: {
        slug: true,
        title: true,
      },
    })

    if (matchingDraftPages.length > 0) {
      throw new Error(
        `This From URL matches a draft page "${matchingDraftPages[0].title}". If you want to redirect this From URL please change that page's slug.`,
      )
    }
  } else {
    // check canonical URLs

    const tenant = await resolveTenant(tenantId)
    const canonicalUrl = await getCanonicalUrlForPath(tenant.slug, validatedValue)

    if (canonicalUrl) {
      // published pages
      const { docs: matchingPages } = await payload.find({
        collection: 'pages',
        depth: 0,
        limit: 1,
        pagination: false,
        where: {
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
          `This From URL matches a page nested in the navigation "${matchingPages[0].title}". If you want to redirect this From URL please change that page's slug or location in the navigation.`,
        )
      }

      // draft pages
      const { docs: matchingDraftPages } = await payload.find({
        collection: 'pages',
        depth: 0,
        limit: 1,
        pagination: false,
        draft: true,
        where: {
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

      if (matchingDraftPages.length > 0) {
        throw new Error(
          `This From URL matches a draft page nested in the navigation "${matchingDraftPages[0].title}". If you want to redirect this From URL please change that page's slug or location in the navigation.`,
        )
      }
    }
  }

  if (validatedValue.startsWith('/blog/')) {
    // check posts

    // published posts
    const { docs: matchingPosts } = await payload.find({
      collection: 'posts',
      depth: 0,
      limit: 1,
      pagination: false,
      where: {
        tenant: {
          equals: tenantId,
        },
        slug: {
          equals: validatedValue.split('/blog/').pop(),
        },
      },
      select: {
        slug: true,
        title: true,
      },
    })

    if (matchingPosts.length > 0) {
      throw new Error(
        `This From URL matches a post "${matchingPosts[0].title}". If you want to redirect this From URL please change that post's slug.`,
      )
    }

    // draft posts
    const { docs: matchingDraftPosts } = await payload.find({
      collection: 'posts',
      depth: 0,
      limit: 1,
      pagination: false,
      where: {
        tenant: {
          equals: tenantId,
        },
        slug: {
          equals: validatedValue.split('/blog/').pop(),
        },
      },
      select: {
        slug: true,
        title: true,
      },
    })

    if (matchingDraftPosts.length > 0) {
      throw new Error(
        `This From URL matches a draft post "${matchingDraftPosts[0].title}". If you want to redirect this From URL please change that post's slug.`,
      )
    }
  }

  /** ensure from URL does not match a built-in page path */

  const { docs: matchingBuiltInPages } = await payload.find({
    collection: 'builtInPages',
    depth: 0,
    limit: 1,
    pagination: false,
    where: {
      tenant: {
        equals: tenantId,
      },
      url: {
        equals: validatedValue,
      },
    },
    select: {
      url: true,
      title: true,
    },
  })

  if (matchingBuiltInPages.length > 0) {
    throw new Error(
      `This From URL matches a built-in page "${matchingBuiltInPages[0].title}". You cannot set up redirects for built-in pages.`,
    )
  }

  return validatedValue
}
