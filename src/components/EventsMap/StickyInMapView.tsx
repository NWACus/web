'use client'

import { cn } from '@/utilities/ui'
import { useQueryState } from 'nuqs'
import type { ReactNode } from 'react'
import { viewParam } from './EventsResults'

/**
 * Keeps the filters in view beside the map while the page scrolls the event list, lined up with
 * the sticky List/Map buttons. Filters taller than the window scroll on their own.
 */
export function StickyInMapView({ children }: { children: ReactNode }) {
  const [view] = useQueryState('view', viewParam)
  return (
    <div
      className={cn(
        view === 'map' &&
          'xl:sticky xl:top-4 xl:max-h-[calc(100dvh-2rem)] xl:overflow-y-auto xl:-mx-1 xl:px-1',
      )}
    >
      {children}
    </div>
  )
}
