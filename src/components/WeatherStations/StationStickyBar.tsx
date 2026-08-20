import { cn } from '@/utilities/ui'
import type { ReactNode } from 'react'

// View tabs plus that view's filters, pinned as one block. The 4rem offset
// clears the sticky mobile site header, matching the root layout's
// `scroll-pt-16`; above lg that header doesn't stick.
export function StationStickyBar({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'sticky top-16 z-20 flex flex-col gap-3 border-b bg-background pb-2 pt-2 lg:top-0',
        className,
      )}
    >
      {children}
    </div>
  )
}
