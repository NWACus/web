'use client'

import type { GetPostsResult, PostListItem } from '@/utilities/queries/getPosts'
import { InfiniteList } from './InfiniteList'
import { PostPreview } from './PostPreview'

const FILTER_KEYS = ['tags', 'sort'] as const

const postsOf = (result: GetPostsResult) => result.posts

interface PostsListProps {
  initialPosts: PostListItem[]
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
}: PostsListProps) => (
  <InfiniteList
    initialItems={initialPosts}
    initialHasMore={initialHasMore}
    initialError={initialError}
    endpoint={`/api/${center}/posts`}
    filterKeys={FILTER_KEYS}
    filterDefaults={{ sort: defaultSort }}
    itemsOf={postsOf}
    itemsLabel="posts"
    className="@container"
    renderItem={(post) => (
      <div className="mb-8" key={post.id}>
        <PostPreview className="h-full" doc={post} />
      </div>
    )}
  />
)
