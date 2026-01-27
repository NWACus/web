import { EventPreview } from '@/components/EventPreview'
import type { SingleEventBlock as SingleEventBlockProps } from '@/payload-types'
import { cn } from '@/utilities/ui'

type SingleEventComponentProps = SingleEventBlockProps & {
  wrapInContainer: boolean
  className?: string
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
    <div className={cn(wrapInContainer && bgColorClass && `${bgColorClass}`)}>
      <div className={cn(wrapInContainer && 'container py-10', '@container', className)}>
        <EventPreview event={event} className={cn('not-prose')} />
      </div>
    </div>
  )
}
