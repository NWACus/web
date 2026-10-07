'use client'

/**
 * Loads the station map in the browser only.
 *
 * Mapbox GL refuses to be server-rendered, and `ssr: false` is only allowed inside a client
 * component — the map's host page is a server component. Props pass straight through.
 */
import dynamic from 'next/dynamic'

import type { StationMapProps } from './StationMap.client'

const StationMap = dynamic(() => import('./StationMap.client').then((mod) => mod.StationMap), {
  ssr: false,
})

export function StationMapLoader(props: StationMapProps) {
  return <StationMap {...props} />
}
