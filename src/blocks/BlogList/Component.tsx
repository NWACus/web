'use client'

import { BackgroundColorWrapper } from '@/components/BackgroundColorWrapper'
import { ButtonLink } from '@/components/ButtonLink'
import { PostPreviewSmallRow } from '@/components/PostPreviewSmallRow'
import RichText from '@/components/RichText'
import type { BlogListBlock as BlogListBlockProps, Post } from '@/payload-types'
import { useTenant } from '@/providers/TenantProvider'
import type { GetPostsResult } from '@/utilities/queries/getPosts'
import {
  filterValidPublishedRelationships,
  filterValidRelationships,
} from '@/utilities/relationships'
import { cn } from '@/utilities/ui'
import { AlertCircle, Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

type BlogListComponentProps = BlogListBlockProps & {
  isLayoutBlock: boolean
  className?: string
}

type FetchStatus = 'loading' | 'ready' | 'error'

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

  const isDynamic = postOptions === 'dynamic'
  const [fetchedPosts, setFetchedPosts] = useState<Post[]>([])
  const [status, setStatus] = useState<FetchStatus>(isDynamic ? 'loading' : 'ready')
  const [error, setError] = useState<string | null>(null)

  // Derived during render rather than inside the effect so the "View all" link carries
  // the block's filters in the server-rendered HTML, not just after hydration.
  const { filterParams, hasUnresolvableTags } = useMemo(() => {
    const configuredTagCount = filterByTags?.length ?? 0
    const tagSlugs = filterValidRelationships(filterByTags).map(({ slug }) => slug)

    // The /blog listing page reads these same `sort` and `tags` query params.
    const params = new URLSearchParams()
    if (sortBy) {
      params.set('sort', sortBy)
    }
    if (tagSlugs.length > 0) {
      params.set('tags', tagSlugs.join(','))
    }

    return {
      filterParams: params,
      // Every configured tag failed to resolve (e.g. the Tag was deleted). Fetching without
      // a `tags` param would silently return posts from every tag, so fail closed instead.
      hasUnresolvableTags: configuredTagCount > 0 && tagSlugs.length === 0,
    }
  }, [filterByTags, sortBy])

  const postsPageParams = filterParams.toString()
  const tenantSlug = tenant?.slug

  useEffect(() => {
    if (!isDynamic || !tenantSlug || hasUnresolvableTags) {
      setFetchedPosts([])
      setStatus('ready')
      return
    }

    const controller = new AbortController()

    const fetchPosts = async () => {
      setStatus('loading')
      setError(null)

      const apiParams = new URLSearchParams(filterParams)
      apiParams.set('limit', String(maxPosts || 4))

      try {
        const response = await fetch(`/api/${tenantSlug}/posts?${apiParams.toString()}`, {
          cache: 'no-store',
          signal: controller.signal,
        })
        const result: GetPostsResult = await response.json()

        if (!response.ok || result.error) {
          setFetchedPosts([])
          setError(result.error || 'Failed to load posts. Please reload the page.')
          setStatus('error')
          return
        }

        setFetchedPosts(result.posts)
        setStatus('ready')
      } catch (_error) {
        if (controller.signal.aborted) return
        setFetchedPosts([])
        setError('An unexpected error occurred. Please try again.')
        setStatus('error')
      }
    }

    fetchPosts()

    return () => controller.abort()
  }, [isDynamic, tenantSlug, filterParams, hasUnresolvableTags, maxPosts])

  const posts = filterValidPublishedRelationships(isDynamic ? fetchedPosts : staticPosts)

  const renderPosts = () => {
    if (isDynamic && status === 'loading') {
      return (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="sr-only">Loading posts</span>
        </div>
      )
    }

    if (isDynamic && status === 'error') {
      return (
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
          <p className="text-muted-foreground">{error}</p>
        </div>
      )
    }

    if (posts.length === 0) {
      return <h3>There are no posts matching these results.</h3>
    }

    return posts.map((post, index) => (
      <PostPreviewSmallRow doc={post} key={`${post.id}__${index}`} />
    ))
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
            posts.length > 1 && '@3xl:grid-cols-2 @6xl:grid-cols-3',
          )}
        >
          {renderPosts()}
        </div>
        {isDynamic && (
          <ButtonLink href={`/blog?${postsPageParams}`} className="not-prose md:self-start">
            View all {heading}
          </ButtonLink>
        )}
      </div>
    </BackgroundColorWrapper>
  )
}
