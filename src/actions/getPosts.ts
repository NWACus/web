'use server'

import { POSTS_LIMIT } from '@/constants/defaults'
import type { Post } from '@/payload-types'
import config from '@/payload.config'
import * as Sentry from '@sentry/nextjs'
import type { Where } from 'payload'
import { getPayload } from 'payload'

export interface GetPostsParams {
  offset?: number | null
  limit?: number | null
  tags?: string | null
  sort?: string | null
  center: string
}

export interface GetPostsResult {
  posts: Post[]
  hasMore: boolean
  total: number
  error?: string
}

export async function getPosts(params: GetPostsParams): Promise<GetPostsResult> {
  const payload = await getPayload({ config })

  try {
    const { tags, sort, center } = params

    const offset = params.offset || 0
    const limit = params.limit || POSTS_LIMIT

    const conditions: Where[] = []

    conditions.push({
      'tenant.slug': {
        equals: center,
      },
    })

    conditions.push({
      _status: {
        equals: 'published',
      },
    })

    if (tags) {
      const selectedTags = tags.split(',').filter(Boolean)
      if (selectedTags.length > 0) {
        conditions.push({
          'tags.slug': {
            in: selectedTags,
          },
        })
      }
    }

    const where: Where = conditions.length > 0 ? { and: conditions } : {}

    const result = await payload.find({
      collection: 'posts',
      where,
      limit: limit || undefined,
      page: limit && offset ? Math.floor(offset / limit) + 1 : undefined,
      sort: sort || '-publishedAt',
      depth: 2,
    })

    return {
      posts: result.docs,
      hasMore: result.hasNextPage,
      total: result.totalDocs,
    }
  } catch (error) {
    payload.logger.error(error, 'Failed to getPosts')
    Sentry.captureException(error)
    return {
      posts: [],
      hasMore: false,
      total: 0,
      error: 'Failed to load posts. Please reload the page or clear your filters.',
    }
  }
}
