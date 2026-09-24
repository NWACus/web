'use client'

/**
 * Loads the observation viewer in the browser only: Mapbox GL refuses to be server-rendered, and
 * `ssr: false` is only allowed inside a client component. Until it arrives the page shows a
 * placeholder the height of the viewer, so nothing jumps when it does.
 */
import dynamic from 'next/dynamic'

import type { ObservationViewerProps } from './ObservationViewer.client'

const ObservationViewer = dynamic(
  () => import('./ObservationViewer.client').then((mod) => mod.ObservationViewer),
  {
    ssr: false,
    loading: () => (
      <div
        role="status"
        className="flex h-[560px] items-center justify-center rounded-lg border text-sm text-muted-foreground"
      >
        Loading observations…
      </div>
    ),
  },
)

export function ObservationViewerLoader(props: ObservationViewerProps) {
  return <ObservationViewer {...props} />
}
