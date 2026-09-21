import getTextColorFromBgColor from '@/utilities/getTextColorFromBgColor'
import { hasBackgroundColor } from '@/utilities/hasBackgroundColor'
import { cn } from '@/utilities/ui'
import type { ReactNode } from 'react'

type BackgroundColorWrapperProps = {
  backgroundColor: string
  children: ReactNode
  isLayoutBlock: boolean
  containerClassName?: string
  outerClassName?: string
}

export const BackgroundColorWrapper = ({
  children,
  backgroundColor,
  isLayoutBlock = false,
  containerClassName,
  outerClassName,
}: BackgroundColorWrapperProps) => {
  const bgColorClass = backgroundColor ? `bg-${backgroundColor}` : ''
  const textColor = getTextColorFromBgColor(backgroundColor)

  return (
    <div
      className={cn(
        'my-10',
        hasBackgroundColor(backgroundColor) && `${bgColorClass} ${textColor}`,
        outerClassName,
      )}
    >
      <div
        className={cn(
          (isLayoutBlock || hasBackgroundColor(backgroundColor)) && 'container',
          hasBackgroundColor(backgroundColor) && 'py-10',
          '@container',
          containerClassName,
        )}
      >
        {children}
      </div>
    </div>
  )
}
