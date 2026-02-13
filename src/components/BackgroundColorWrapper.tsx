import getTextColorFromBgColor from '@/utilities/getTextColorFromBgColor'
import { cn } from '@/utilities/ui'
import type { ReactNode } from 'react'

type BackgroundColorWrapperProps = {
  backgroundColor: string
  children: ReactNode
  isLexical: boolean
  containerClassName?: string
  outerClassName?: string
}

export const BackgroundColorWrapper = ({
  children,
  backgroundColor,
  isLexical = false,
  containerClassName,
  outerClassName,
}: BackgroundColorWrapperProps) => {
  const bgColorClass = backgroundColor ? `bg-${backgroundColor}` : ''
  const textColor = getTextColorFromBgColor(backgroundColor)

  return (
    <div
      className={cn(
        bgColorClass !== 'transparent' && `${bgColorClass} ${textColor}`,
        outerClassName,
      )}
    >
      <div
        className={cn(
          (!isLexical || bgColorClass !== 'transparent') && 'container py-10',
          '@container',
          containerClassName,
        )}
      >
        {children}
      </div>
    </div>
  )
}
