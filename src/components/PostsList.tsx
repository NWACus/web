'use client'

import { getPosts } from '@/actions/getPosts'
import { useFiltersTotalContext } from '@/contexts/FiltersTotalContext'
import type { Post } from '@/payload-types'
import { AlertCircle, Loader2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { PostPreview } from './PostPreview'
import { Card } from './ui/card'

interface PostsListProps {
  initialPosts: Post[]
  initialHasMore: boolean
  initialError?: string
  center: string
  defaultSort?: string
}

export const PostsList = ({
  initialPosts,
  initialHasMore,
  initialError,
  center,
  defaultSort = '-publishedAt',
}: PostsListProps) => {
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [offset, setOffset] = useState(initialPosts.length)
  const [hasMoreData, setHasMoreData] = useState(initialHasMore)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(initialError || null)
  const searchParams = useSearchParams()
  const previousParamsRef = useRef<string>(searchParams.toString())
  const { setTotal } = useFiltersTotalContext()

  // Rebuild filters from current URL params
  const stableFilters = useMemo(() => {
    const tags = searchParams.get('tags')
    const sort = searchParams.get('sort')
    return {
      center,
      tags: tags || null,
      sort: sort || defaultSort,
    }
  }, [searchParams, center, defaultSort])

  const { ref, inView } = useInView({
    threshold: 0,
    triggerOnce: false,
  })

  // Reset posts when URL search params change
  useEffect(() => {
    const currentParams = searchParams.toString()

    // Only refetch if params actually changed
    if (currentParams !== previousParamsRef.current) {
      previousParamsRef.current = currentParams

      const resetAndFetch = async () => {
        setIsLoading(true)
        setError(null)
        try {
          const result = await getPosts({
            ...stableFilters,
            offset: 0,
          })

          if (result.error) {
            setError(result.error)
            setPosts([])
            setHasMoreData(false)
            setTotal(0)
          } else {
            setPosts(result.posts)
            setOffset(result.posts.length)
            setHasMoreData(result.hasMore)
            setTotal(result.total)
          }
        } catch (_error) {
          setError('An unexpected error occurred. Please try again.')
        } finally {
          setIsLoading(false)
        }
      }

      resetAndFetch()
    }
  }, [searchParams, setTotal, stableFilters])

  useEffect(() => {
    if (inView && hasMoreData && !isLoading) {
      const loadMore = async () => {
        setIsLoading(true)
        try {
          const result = await getPosts({
            ...stableFilters,
            offset,
          })

          if (result.error) {
            setError(result.error)
            setHasMoreData(false)
          } else {
            // Deduplicate posts by ID to prevent duplicate key errors
            setPosts((prevPosts) => {
              const existingIds = new Set(prevPosts.map((post) => post.id))
              const newPosts = result.posts.filter((post) => !existingIds.has(post.id))
              return [...prevPosts, ...newPosts]
            })
            setOffset((prevOffset) => prevOffset + result.posts.length)
            setHasMoreData(result.hasMore)
          }
        } catch (_error) {
          setError('An unexpected error occurred while loading more posts.')
          setHasMoreData(false)
        } finally {
          setIsLoading(false)
        }
      }

      loadMore()
    }
  }, [inView, hasMoreData, isLoading, offset, stableFilters])

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Error Loading Posts</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      </Card>
    )
  }

  if (posts.length === 0 && !isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No posts found matching your criteria.</p>
      </div>
    )
  }

  return (
    <div className="@container">
      {posts.map((post) => (
        <div className="mb-8" key={post.id}>
          <PostPreview className="h-full" doc={post} />
        </div>
      ))}

      {hasMoreData && (
        <div ref={ref} className="flex justify-center py-8">
          {isLoading && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
        </div>
      )}
    </div>
  )
}
