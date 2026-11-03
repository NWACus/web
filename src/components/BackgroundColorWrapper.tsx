import { hasBackgroundColor } from '@/fields/color'
import getTextColorFromBgColor from '@/utilities/getTextColorFromBgColor'
import { cn } from '@/utilities/ui'
import type { ReactNode } from 'react'

export const BLOCK_PADDING = 'py-6 md:py-8'

// Colored blocks pad inside their color; the space between blocks comes from RenderBlocks
export function blockSpacing(backgroundColor: string | null | undefined) {
  const hasBg = hasBackgroundColor(backgroundColor)
  return {
    inner: hasBg && BLOCK_PADDING,
    bg: hasBg && `bg-${backgroundColor}`,
  }
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
  const spacing = blockSpacing(backgroundColor)

  return (
    <div
      className={cn(
        spacing.bg,
        spacing.bg && getTextColorFromBgColor(backgroundColor),
        outerClassName,
      )}
    >
      <div
        className={cn(
          (isLayoutBlock || spacing.bg) && 'container',
          spacing.inner,
          '@container',
          containerClassName,
        )}
      >
        {children}
      </div>
    </div>
  )
}
