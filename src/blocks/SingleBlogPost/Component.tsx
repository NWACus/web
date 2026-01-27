import { PostPreview } from '@/components/PostPreview'
import type { SingleBlogPostBlock as SingleBlogPostBlockProps } from '@/payload-types'
import { isValidPublishedRelationship } from '@/utilities/relationships'
import { cn } from '@/utilities/ui'

type SingleBlogPostComponentProps = SingleBlogPostBlockProps & {
  wrapInContainer: boolean
  className?: string
}

export const SingleBlogPostBlockComponent = ({
  post,
  backgroundColor,
  className,
  wrapInContainer = true,
}: SingleBlogPostComponentProps) => {
  if (!isValidPublishedRelationship(post)) {
    return null
  }

  const bgColorClass = `bg-${backgroundColor}`

  return (
    <div className={cn(wrapInContainer && bgColorClass && `${bgColorClass}`)}>
      <div className={cn(wrapInContainer && 'container py-10', '@container', className)}>
        <PostPreview doc={post} className={cn('not-prose')} />
      </div>
    </div>
  )
}
