import { BlogListBlock, Post } from '@/payload-types'
import { resolveTenant } from '@/utilities/tenancy/resolveTenant'
import configPromise from '@payload-config'
import * as Sentry from '@sentry/nextjs'
import { getPayload, JsonObject, TypeWithID, type FieldHook } from 'payload'

const DEFAULT_POSTS_LIMIT = 10

function isBlogListBlock(blockData: JsonObject | undefined): blockData is BlogListBlock {
  return blockData?.blockType === 'blogList'
}

export const populateQueriedPosts: FieldHook<TypeWithID, Post[], BlogListBlock> = async ({
  blockData,
  collection,
  data,
  draft,
  value,
  context,
}) => {
  if (context?.skipAfterRead) return value || []

  const payload = await getPayload({ config: configPromise })

  const tenant =
    data && 'tenant' in data && typeof data?.tenant === 'number'
      ? await resolveTenant(data.tenant)
      : null

  if (blockData === undefined) {
    payload.logger.error(
      `blockData was undefined in populateQueriedPosts for "${collection?.slug ?? 'unknown collection'}" document with id "${data?.id ?? 'unknown document id'}"`,
    )
    return []
  }

  if (blockData?.blockType !== 'blogList') {
    payload.logger.error(
      `blockData.blockType was not "blogList". Returning an empty array value in populateQueriedPosts for "${collection?.slug ?? 'unknown collection'}" document with id "${data?.id ?? 'unknown document id'}"`,
    )
    return []
  }

  if (!isBlogListBlock(blockData)) {
    payload.logger.error(
      `blockData.blockType was not "blogList". Returning an empty array value in populateQueriedPosts for "${collection?.slug ?? 'unknown collection'}" document with id "${data?.id ?? 'unknown document id'}"`,
    )
    return []
  }

  if (tenant) {
    const { filterByTags, maxPosts, sortBy } = blockData

    try {
      const filterByTagsIds =
        filterByTags?.map((tag) => (typeof tag === 'number' ? tag : tag.id)) ?? []

      const postsRes = await payload.find({
        collection: 'posts',
        depth: 2,
        limit: maxPosts ? Math.floor(maxPosts) : DEFAULT_POSTS_LIMIT,
        where: {
          'tenant.slug': {
            equals: tenant.slug,
          },
          _status: {
            equals: 'published',
          },
          ...(filterByTagsIds &&
            filterByTagsIds.length > 0 && {
              tags: {
                in: filterByTagsIds,
              },
            }),
        },
        sort: sortBy,
        draft,
        context: {
          skipAfterRead: true,
        },
      })
      return postsRes.docs
    } catch (err) {
      payload.logger.error(err, 'Failed to query posts for BlogListBlock.')
      Sentry.captureException(err)
    }
  }
  return value ?? []
}
