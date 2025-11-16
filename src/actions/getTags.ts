'use server'

import config from '@/payload.config'
import * as Sentry from '@sentry/nextjs'
import { getPayload } from 'payload'

export interface GetTagsResult {
  tags: { label: string; value: string }[]
  error?: string
}

export async function getTags(center: string): Promise<GetTagsResult> {
  const payload = await getPayload({ config })

  try {
    const result = await payload.find({
      collection: 'tags',
      where: {
        and: [
          {
            'tenant.slug': {
              equals: center,
            },
          },
          {
            'posts.id': {
              exists: true,
            },
          },
          {
            'posts._status': {
              equals: 'published',
            },
          },
        ],
      },
      pagination: false,
      select: {
        title: true,
        slug: true,
      },
      sort: 'title',
    })

    const tags = result.docs.map(({ title, slug }) => ({
      label: title,
      value: slug,
    }))

    return {
      tags,
    }
  } catch (error) {
    payload.logger.error(error, 'Failed to getTags')
    Sentry.captureException(error)
    return {
      tags: [],
      error: 'Failed to load tags.',
    }
  }
}
