'use server'

import type { Tag } from '@/payload-types'
import config from '@/payload.config'
import * as Sentry from '@sentry/nextjs'
import { getPayload } from 'payload'

export interface GetTagsResult {
  tags: { id: number; title: string; slug: string }[]
  error?: string
}

export async function getTags(center: string): Promise<GetTagsResult> {
  const payload = await getPayload({ config })

  try {
    // Get all published posts for this center with tags populated
    const posts = await payload.find({
      collection: 'posts',
      where: {
        'tenant.slug': {
          equals: center,
        },
        _status: {
          equals: 'published',
        },
      },
      limit: 1000,
      pagination: false,
      depth: 1, // Populate tags
    })

    // Extract unique tags from posts using a Map for deduplication
    const tagMap = new Map<number, Tag>()
    posts.docs.forEach((post) => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach((tag) => {
          if (tag && typeof tag === 'object' && 'id' in tag) {
            tagMap.set(tag.id, tag as Tag)
          }
        })
      }
    })

    // Convert to array and sort by title
    const tags = Array.from(tagMap.values()).sort((a, b) => a.title.localeCompare(b.title))

    return {
      tags: tags.map((tag) => ({
        id: Number(tag.id),
        title: tag.title,
        slug: tag.slug,
      })),
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
