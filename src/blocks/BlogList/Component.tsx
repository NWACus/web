'use client'

import { BackgroundColorWrapper } from '@/components/BackgroundColorWrapper'
import { ButtonLink } from '@/components/ButtonLink'
import { PostPreviewSmallRow } from '@/components/PostPreviewSmallRow'
import RichText from '@/components/RichText'
import type { BlogListBlock as BlogListBlockProps, Post } from '@/payload-types'
import { useTenant } from '@/providers/TenantProvider'
import {
  filterValidPublishedRelationships,
  filterValidRelationships,
} from '@/utilities/relationships'
import { cn } from '@/utilities/ui'
import { useEffect, useState } from 'react'

type BlogListComponentProps = BlogListBlockProps & {
  isLayoutBlock: boolean
  className?: string
}

export const BlogListBlockComponent = (args: BlogListComponentProps) => {
  const {
    heading,
    belowHeadingContent,
    backgroundColor,
    className,
    isLayoutBlock = true,
    postOptions,
  } = args

  const { filterByTags, sortBy, maxPosts } = args.dynamicOptions || {}
  const { staticPosts } = args.staticOptions || {}
  const { tenant } = useTenant()
  const [fetchedPosts, setFetchedPosts] = useState<Post[]>([])
  const [postsPageParams, setPostsPageParams] = useState<string>('')

  useEffect(() => {
    if (postOptions !== 'dynamic') return

    const fetchPosts = async () => {
      const tenantSlug = typeof tenant === 'object' && tenant?.slug
      if (!tenantSlug) return

      const filterByTagsSlugs = filterValidRelationships(filterByTags).map(({ slug }) => slug)

      // Filters shared by both the posts API fetch and the "View all" /blog link.
      // The /blog listing page reads the same `sort` and `tags` query params.
      const filterParams = new URLSearchParams()
      if (sortBy) {
        filterParams.set('sort', sortBy)
      }
      if (filterByTagsSlugs.length > 0) {
        filterParams.set('tags', filterByTagsSlugs.join(','))
      }

      setPostsPageParams(filterParams.toString())

      // The API fetch additionally needs the result limit.
      const apiParams = new URLSearchParams(filterParams)
      apiParams.set('limit', String(maxPosts || 4))

      const response = await fetch(`/api/${tenantSlug}/posts?${apiParams.toString()}`, {
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch posts')
      }

      const data = await response.json()
      setFetchedPosts(data.posts || [])
    }

    fetchPosts()
  }, [tenant, filterByTags, sortBy, postOptions, maxPosts])

  let posts: Post[] = filterValidPublishedRelationships(staticPosts)

  if (postOptions === 'dynamic') {
    posts = filterValidPublishedRelationships(fetchedPosts)
  }

  if (!posts) {
    return null
  }

  return (
    <BackgroundColorWrapper
      backgroundColor={backgroundColor}
      isLayoutBlock={isLayoutBlock}
      containerClassName={className}
    >
      <div className="bg-card text-card-foreground p-6 border shadow rounded-lg flex flex-col gap-6">
        <div className="flex flex-col justify-start gap-1">
          {heading && (
            <div className="prose md:prose-md dark:prose-invert">
              <h2>{heading}</h2>
            </div>
          )}
          {belowHeadingContent && (
            <div>
              <RichText data={belowHeadingContent} enableGutter={false} />
            </div>
          )}
        </div>
        <div
          className={cn(
            'grid gap-4 lg:gap-6 not-prose max-h-[400px] overflow-y-auto',
            posts && posts.length > 1 && '@3xl:grid-cols-2 @6xl:grid-cols-3',
          )}
        >
          {posts && posts?.length > 0 ? (
            posts?.map((post, index) => (
              <PostPreviewSmallRow doc={post} key={`${post.id}__${index}`} />
            ))
          ) : (
            <h3>There are no posts matching these results.</h3>
          )}
        </div>
        {postOptions === 'dynamic' && (
          <ButtonLink
            href={`/blog?${postsPageParams.toString()}`}
            className="not-prose md:self-start"
          >
            View all {heading}
          </ButtonLink>
        )}
      </div>
    </BackgroundColorWrapper>
  )
}
