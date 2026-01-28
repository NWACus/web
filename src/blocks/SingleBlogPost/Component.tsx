import { BackgroundColorWrapper } from '@/components/BackgroundColorWrapper'
import { PostPreview } from '@/components/PostPreview'
import type { SingleBlogPostBlock as SingleBlogPostBlockProps } from '@/payload-types'
import { isValidPublishedRelationship } from '@/utilities/relationships'
import { cn } from '@/utilities/ui'

type SingleBlogPostComponentProps = SingleBlogPostBlockProps & {
  isLexical: boolean
  className?: string
}

export const SingleBlogPostBlockComponent = ({
  post,
  backgroundColor,
  className,
  isLexical = true,
}: SingleBlogPostComponentProps) => {
  if (!isValidPublishedRelationship(post)) {
    return null
  }

  return (
    <BackgroundColorWrapper
      backgroundColor={backgroundColor}
      isLexical={isLexical}
      containerClassName={className}
    >
      <PostPreview doc={post} className={cn('not-prose')} />
    </BackgroundColorWrapper>
  )
}
