/**
 * What the map says about itself when it can't do its job: no WebGL (the list still lists the
 * center's zones), no Mapbox token, or markers that failed to load — never a silent blank.
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
  tilesFailed: boolean
}

export function MapNotices({ unsupported, unconfigured, tilesFailed }: MapNoticesProps) {
  if (unconfigured) return <Cover>The observation map is not configured for this site.</Cover>
  if (unsupported) {
    return <Cover>This browser can&apos;t display the map. Observations are listed with it.</Cover>
  }
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
