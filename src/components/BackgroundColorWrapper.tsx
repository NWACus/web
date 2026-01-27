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

  return (
    <div className={cn(wrapInContainer && bgColorClass, outerClassName)}>
      <div className={cn(wrapInContainer && 'container py-10', '@container', containerClassName)}>
        {children}
      </div>
    </div>
  )
}
