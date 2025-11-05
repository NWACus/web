import { EventPreview } from '@/components/EventPreview'
import type { SingleEventBlock as SingleEventBlockProps } from '@/payload-types'
import { cn } from '@/utilities/ui'

type SingleEventComponentProps = SingleEventBlockProps & {
  className?: string
  wrapInContainer?: boolean
}

export const SingleEventBlockComponent = ({
  event,
  backgroundColor,
  className,
  wrapInContainer = true,
}: SingleEventComponentProps) => {
  if (!event || typeof event !== 'object') {
    return null
  }

  const bgColorClass = `bg-${backgroundColor}`

  return (
    <div className={cn(bgColorClass && `${bgColorClass}`)}>
      <div className={cn(wrapInContainer && 'container py-10', '@container', className)}>
        <EventPreview doc={event} className={cn('not-prose')} />
      </div>
    </div>
  )
}
