import { Info } from 'lucide-react'

import type { HoveredZone } from './useZoneOutlines'

/** The zone under the pointer, named over the map as the widget does (at its head, clear of the legend). */
export function ZoneHoverCard({ zone }: { zone: HoveredZone | null }) {
  if (!zone) return null
  return (
    <div className="pointer-events-none absolute left-1/2 top-2 z-10 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded bg-white px-2 py-1 text-sm text-neutral-900 shadow">
      <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
      <div>
        <div>{zone.center}</div>
        <div className="font-bold">{zone.name} Zone</div>
      </div>
    </div>
  )
}
