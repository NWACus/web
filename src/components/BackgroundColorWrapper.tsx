import getTextColorFromBgColor from '@/utilities/getTextColorFromBgColor'
import { cn } from '@/utilities/ui'
import type { ReactNode } from 'react'

// Whether a block's background color picker value paints anything. The page is
// white, so `white` and `transparent` (the picker's default) both read as none.
export function hasBackgroundColor(backgroundColor?: string | null): boolean {
  return !!backgroundColor && backgroundColor !== 'transparent' && backgroundColor !== 'white'
}

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
        isLayoutBlock && !hasBackgroundColor(backgroundColor) && 'my-10',
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
