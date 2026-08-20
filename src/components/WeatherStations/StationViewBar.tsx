import { cn } from '@/utilities/ui'
import type { ReactNode } from 'react'

// View tabs plus that view's filters. The box is identical whether or not it
// pins, so switching tabs doesn't shift the tab bar under the cursor.
//
// When pinned, the 4rem offset clears the sticky mobile site header, matching
// the root layout's `scroll-pt-16`; above lg that header doesn't stick.
export function StationViewBar({
  children,
  className,
  pinned = true,
}: {
  children: ReactNode
  className?: string
  pinned?: boolean
}) {
  return (
    <div
      className={cn(
        // No border here: the tab nav carries its own, and on the Download tab
        // (tabs only) a second one lands right under it as a doubled line.
        'z-20 flex flex-col gap-3 bg-background pb-2 pt-2',
        pinned && 'sticky top-16 lg:top-0',
        className,
      )}
    >
      {children}
    </div>
  )
}
