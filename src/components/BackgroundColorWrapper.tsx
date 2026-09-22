import getTextColorFromBgColor from '@/utilities/getTextColorFromBgColor'
import { cn } from '@/utilities/ui'
import type { ReactNode } from 'react'

// Whether a block's background color picker value paints anything. The page is
// white, so `white` and `transparent` (the picker's default) both read as none.
export function hasBackgroundColor(backgroundColor?: string | null): boolean {
  return !!backgroundColor && backgroundColor !== 'transparent' && backgroundColor !== 'white'
}

export const BLOCK_MARGIN = 'my-3 md:my-5'
export const BLOCK_PADDING = 'py-3 md:py-5'

// Each block contributes half the gap, so any seam involving a background lands on 40px at md. A
// block with no background carries its half as margin, which collapses with its neighbor's; a block
// with a background carries it as padding inside the color, so two colored blocks touch and two
// plain ones end up half as far apart. Inline Lexical blocks get no margin.
// `bg` is the background class, only when there is one to paint.
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
  const bgColorClass = backgroundColor ? `bg-${backgroundColor}` : ''
  const textColor = getTextColorFromBgColor(backgroundColor)
  const spacing = blockSpacing(backgroundColor, isLayoutBlock)

  return (
    <div
      className={cn(
        spacing.outer,
        hasBackgroundColor(backgroundColor) && `${bgColorClass} ${textColor}`,
        outerClassName,
      )}
    >
      <div
        className={cn(
          (isLayoutBlock || hasBackgroundColor(backgroundColor)) && 'container',
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
