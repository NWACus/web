import { PostCollection } from '@/components/PostCollection'
import RichText from '@/components/RichText'
import type { BlogListBlock as BlogListBlockProps, Post, Tag } from '@/payload-types'
import { resolveTenantFromCookie } from '@/utilities/tenancy/resolveTenant'
import configPromise from '@payload-config'
import { draftMode, headers } from 'next/headers'
import { getPayload } from 'payload'

const DEFAULT_POSTS_LIMIT = 4

export const BlogListBlock = async (props: BlogListBlockProps) => {
  const { heading, belowHeadingContent, filterByTags, sortBy, maxPosts, staticPosts } = props

  let posts = staticPosts?.filter(
    (post): post is Post =>
      typeof post === 'object' && post !== null && post._status === 'published',
  )

  if (!staticPosts || staticPosts.length === 0) {
    const payload = await getPayload({ config: configPromise })

    const headersList = await headers()
    const tenant = await resolveTenantFromCookie(headersList)

    if (tenant) {
      try {
        const filterByTagsIds = filterByTags
          ?.filter((tag): tag is Tag => typeof tag === 'object' && tag !== null)
          .map(({ id }) => id)
        const { isEnabled: draft } = await draftMode()

        const postsRes = await payload.find({
          collection: 'posts',
          depth: 2,
          limit: maxPosts ?? DEFAULT_POSTS_LIMIT,
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
        })
        posts = postsRes.docs
      } catch (err) {
        // TODO add sentry capture expection
        console.error('Failed to query posts for BlogListBlock. Error: ', err)
      }
    }
  }

  if (!posts) {
    return null
  }

  return (
    <div className="py-16">
      <div className="container">
        {heading && (
          <div className="prose md:prose-md dark:prose-invert">
            <h2>{heading}</h2>
          </div>
        )}
        {belowHeadingContent && (
          <div className="mb-8">
            <RichText data={belowHeadingContent} enableGutter={false} />
          </div>
        )}
        <div className="grid gap-8">
          <PostCollection posts={posts} />
        </div>
      </div>
    </div>
  )
}
