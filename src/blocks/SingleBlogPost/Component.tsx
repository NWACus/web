import { Card } from '@/components/Card'
import { PostPreviewHorizontal } from '@/components/PostPreviewHorizontal'
import type { SingleBlogPostBlock as SingleBlogPostBlockProps } from '@/payload-types'
import getTextColorFromBgColor from '@/utilities/getTextColorFromBgColor'
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
  const textColor = getTextColorFromBgColor(backgroundColor)

  return (
    <div className={cn(bgColorClass, textColor)}>
      <div className={cn(wrapInContainer && 'container py-16', className)}>
        <Card doc={post} relationTo="posts" className="md:hidden flex-1" />
        <PostPreviewHorizontal doc={post} relationTo="posts" className="hidden md:flex my-0" />
      </div>
    </div>
  )
}
