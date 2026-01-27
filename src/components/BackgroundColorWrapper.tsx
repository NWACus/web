import getTextColorFromBgColor from '@/utilities/getTextColorFromBgColor'
import { cn } from '@/utilities/ui'
import type { ReactNode } from 'react'

type BackgroundColorWrapperProps = {
  backgroundColor: string
  children: ReactNode
  wrapInContainer: boolean
  containerClassName?: string
  outerClassName?: string
}

export const BackgroundColorWrapper = ({
  children,
  backgroundColor,
  wrapInContainer = true,
  containerClassName,
  outerClassName,
}: BackgroundColorWrapperProps) => {
  const bgColorClass = backgroundColor ? `bg-${backgroundColor}` : ''
  const textColor = getTextColorFromBgColor(backgroundColor)

  return (
    <div className={cn(wrapInContainer && bgColorClass, bgColorClass && textColor, outerClassName)}>
      <div className={cn(wrapInContainer && 'container py-10', '@container', containerClassName)}>
        {children}
      </div>
    </div>
  )
}
