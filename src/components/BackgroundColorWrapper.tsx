import { isPaletteColor } from '@/fields/color'
import getTextColorFromBgColor from '@/utilities/getTextColorFromBgColor'
import { cn } from '@/utilities/ui'
import type { ReactNode } from 'react'

// `white` counts as a color; `transparent` and values outside the palette paint nothing.
export function hasBackgroundColor(backgroundColor?: string | null): boolean {
  return isPaletteColor(backgroundColor) && backgroundColor !== 'transparent'
}

export const BLOCK_MARGIN = 'my-3 md:my-5'
export const BLOCK_PADDING = 'py-6 md:py-8'

// Plain layout blocks get collapsing margin, colored ones padding; see docs/coding-guide.md.
export function blockSpacing(backgroundColor: string | null | undefined, isLayoutBlock: boolean) {
  const hasBg = hasBackgroundColor(backgroundColor)
  return {
    outer: isLayoutBlock && !hasBg && BLOCK_MARGIN,
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
  const spacing = blockSpacing(backgroundColor, isLayoutBlock)

  return (
    <div
      className={cn(
        spacing.outer,
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
