'use client'

import type { BlogListBlock } from '@/payload-types'
import { useTenant } from '@/providers/TenantProvider'
import type { GetPostsResult, PostListItem } from '@/utilities/queries/getPosts'
import { filterValidRelationships } from '@/utilities/relationships'
import { useEffect, useMemo, useState } from 'react'

type DynamicOptions = NonNullable<BlogListBlock['dynamicOptions']>

export type DynamicPostsStatus = 'loading' | 'ready' | 'error'

type DynamicPostsState = {
  posts: PostListItem[]
  status: DynamicPostsStatus
  error: string | null
  /** Query string for the "View all" link. The /blog page reads the same `sort` and `tags` params. */
  postsPageParams: string
}

/**
 * Fetches the posts for a Blog List block configured with filters.
 *
 * The filter params are derived during render rather than inside the effect so that
 * `postsPageParams` is correct in server-rendered HTML, not just after hydration.
 */
export const useDynamicPosts = (
  { filterByTags, sortBy, maxPosts }: Partial<DynamicOptions>,
  enabled: boolean,
): DynamicPostsState => {
  const { tenant } = useTenant()
  const [posts, setPosts] = useState<PostListItem[]>([])
  const [status, setStatus] = useState<DynamicPostsStatus>(enabled ? 'loading' : 'ready')
  const [error, setError] = useState<string | null>(null)

  const { filterParams, hasUnresolvableTags } = useMemo(() => {
    const configuredTagCount = filterByTags?.length ?? 0
    const tagSlugs = filterValidRelationships(filterByTags).map(({ slug }) => slug)

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

  const tenantSlug = tenant?.slug

  useEffect(() => {
    if (!enabled || !tenantSlug || hasUnresolvableTags) {
      setPosts([])
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
          setPosts([])
          setError(result.error || 'Failed to load posts. Please reload the page.')
          setStatus('error')
          return
        }

        setPosts(result.posts)
        setStatus('ready')
      } catch (_error) {
        if (controller.signal.aborted) return
        setPosts([])
        setError('An unexpected error occurred. Please try again.')
        setStatus('error')
      }
    }

    fetchPosts()

    return () => controller.abort()
  }, [enabled, tenantSlug, filterParams, hasUnresolvableTags, maxPosts])

  return { posts, status, error, postsPageParams: filterParams.toString() }
}
