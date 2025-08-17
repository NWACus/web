import { PostPreviewHorizontal } from '@/components/PostPreviewHorizontal'
import type { SingleBlogPostBlock as SingleBlogPostBlockProps } from '@/payload-types'

export const SingleBlogPostBlock = (props: SingleBlogPostBlockProps) => {
  const { post } = props

  if (!post || typeof post !== 'object' || post._status !== 'published') {
    return null
  }

  return (
    <div className="py-16">
      <div className="container">
        <PostPreviewHorizontal doc={post} relationTo="posts" />
      </div>
    </div>
  )
}
