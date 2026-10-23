'use client'

import { viewParam } from '@/components/EventsMap/EventsResults'
import { cn } from '@/utilities/ui'
import { useQueryState } from 'nuqs'

/** The filter sidebar. In the wide map view the filters move into the bar above the map instead. */
export function EventsFiltersColumn({ children }: { children: React.ReactNode }) {
  const [view] = useQueryState('view', viewParam)
  return (
    <div
      className={cn(
        'hidden md:flex flex-col shrink-0 justify-between md:justify-start md:w-[240px] xl:w-[300px] order-1 md:order-2',
        view === 'map' && 'xl:hidden',
      )}
    >
      {children}
    </div>
  )
}
