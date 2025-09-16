import { PostPreview } from '@/components/PostPreview'
import type { SingleBlogPostBlock as SingleBlogPostBlockProps } from '@/payload-types'
import { cn } from '@/utilities/ui'

type SingleBlogPostComponentProps = SingleBlogPostBlockProps & {
  className?: string
  wrapInContainer?: boolean
}

export const SingleBlogPostBlockComponent = ({
  post,
  backgroundColor,
  className,
  wrapInContainer = true,
}: SingleBlogPostComponentProps) => {
  if (!post || typeof post !== 'object' || post._status !== 'published') {
    return null
  }

  const bgColorClass = `bg-${backgroundColor}`

  return (
    <div className={cn(wrapInContainer && bgColorClass)}>
      <div className={cn(wrapInContainer && 'container py-10', '@container', className)}>
        <PostPreview doc={post} className={cn('not-prose')} />
      </div>
    </div>
  )
}
