/**
 * What the map says about itself when it can't do its job: no WebGL (the list still lists the
 * center's zones), no Mapbox token, a basemap that failed to load, or markers that failed to load
 * — never a silent blank.
 */
import type { ReactNode } from 'react'

function Cover({ children }: { children: ReactNode }) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/90 p-4 text-center text-sm text-muted-foreground">
      <span role="alert">{children}</span>
    </div>
  )
}

interface MapNoticesProps {
  unsupported: boolean
  unconfigured: boolean
  styleFailed: boolean
  tilesFailed: boolean
}

/** A notice that covers the map, for a map that can't show at all. */
function coverMessage({
  unsupported,
  unconfigured,
  styleFailed,
}: Omit<MapNoticesProps, 'tilesFailed'>): string | null {
  if (unconfigured) return 'The observation map is not configured for this site.'
  if (unsupported) return "This browser can't display the map. Observations are listed with it."
  if (styleFailed) return "The map couldn't load. Observations are listed with it."
  return null
}

export function MapNotices({ tilesFailed, ...props }: MapNoticesProps) {
  const message = coverMessage(props)
  if (message) return <Cover>{message}</Cover>
  if (!tilesFailed) return null
  return (
    <div
      role="alert"
      className="absolute left-1/2 top-2 z-20 -translate-x-1/2 rounded bg-white/95 px-2 py-1 text-xs text-neutral-800 shadow"
    >
      Couldn&apos;t load the map markers. The list is unaffected.
    </div>
  )
}
