import { PostPreviewSmallRow } from '@/components/PostPreviewSmallRow'
import type { Post } from '@/payload-types'
import { AlertCircle, Loader2 } from 'lucide-react'
import type { DynamicPostsStatus } from './useDynamicPosts'

type BlogListPostsProps = {
  posts: Post[]
  status: DynamicPostsStatus
  error: string | null
}

export const BlogListPosts = ({ posts, status, error }: BlogListPostsProps) => {
  if (status === 'loading') {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="sr-only">Loading posts</span>
      </div>
    )
  }

  if (status === 'error') {
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

  return posts.map((post, index) => <PostPreviewSmallRow doc={post} key={`${post.id}__${index}`} />)
}
