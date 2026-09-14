import getTextColorFromBgColor from '@/utilities/getTextColorFromBgColor'
import { cn } from '@/utilities/ui'
import type { ReactNode } from 'react'

export type EmbedLayoutProps = {
  backgroundColor?: string
  alignContent?: 'left' | 'center' | 'right' | null
  isLayoutBlock?: boolean
  className?: string
  children: ReactNode
}

// The wrapper every embed block renders around its content, whether that content is a sandboxed
// iframe or the provider's snippet itself.
export const EmbedLayout = ({
  backgroundColor = 'transparent',
  alignContent,
  isLayoutBlock = true,
  className,
  children,
}: EmbedLayoutProps) => {
  // Stored as `… | null`, and a parameter default only fires on `undefined`.
  const align = alignContent ?? 'left'

  return (
    <div className={cn(`bg-${backgroundColor}`, getTextColorFromBgColor(backgroundColor))}>
      <div
        className={cn(
          isLayoutBlock && 'container py-10',
          'flex flex-col',
          align === 'left' && 'items-start',
          align === 'center' && 'items-center',
          align === 'right' && 'items-end',
          className,
        )}
      >
        {children}
      </div>
    </div>
  )
}
