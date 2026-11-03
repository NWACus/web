import { cn } from '@/utilities/ui'
import type { ReactNode, Ref } from 'react'

// View tabs plus that view's filters. The box is identical whether or not it
// pins, so switching tabs doesn't shift the tab bar under the cursor.
//
// When pinned, it clears the admin bar and the sticky mobile header strip
// (banners + header), whose height StickyHeaderStrip publishes; above lg the
// strip doesn't stick.
export function StationViewBar({
  children,
  className,
  pinned = true,
  ref,
}: {
  children: ReactNode
  className?: string
  pinned?: boolean
  ref?: Ref<HTMLDivElement>
}) {
  return (
    <div
      ref={ref}
      className={cn(
        // No border here: the tab nav carries its own, and on the Download tab
        // (tabs only) a second one lands right under it as a doubled line.
        'z-20 flex flex-col gap-3 bg-background pb-2 pt-2',
        pinned &&
          'sticky top-[calc(var(--admin-bar-height,0px)+var(--sticky-header-height,4rem))] lg:top-0',
        className,
      )}
    >
      {children}
    </div>
  )
}
