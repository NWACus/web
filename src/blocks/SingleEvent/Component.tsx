import { BackgroundColorWrapper } from '@/components/BackgroundColorWrapper'
import { EventPreview } from '@/components/EventPreview'
import type { SingleEventBlock as SingleEventBlockProps } from '@/payload-types'
import { cn } from '@/utilities/ui'

type SingleEventComponentProps = SingleEventBlockProps & {
  isLayoutBlock: boolean
  className?: string
}

export const SingleEventBlockComponent = ({
  event,
  backgroundColor,
  className,
  isLayoutBlock = true,
}: SingleEventComponentProps) => {
  if (!event || typeof event !== 'object') {
    return null
  }

  return (
    <BackgroundColorWrapper
      backgroundColor={backgroundColor}
      isLayoutBlock={isLayoutBlock}
      containerClassName={className}
    >
      <EventPreview event={event} className={cn('not-prose')} />
    </BackgroundColorWrapper>
  )
}
