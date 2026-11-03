'use client'

/**
 * Where the record is: the widget's header map — a live, non-interactive Mapbox map at zoom 9 with
 * a fullscreen control and the record's marker. Mapbox GL can't be server-rendered, so the record's
 * own page (a server page) gets it through this client-only loader, with a placeholder its size.
 *
 * It replaced a Mapbox Static Images `<img>` (a tenth of the price per view), for the widget's
 * zoom and fullscreen; see the follow-up issue on bringing the static version back.
 */
import dynamic from 'next/dynamic'

import type { LatLng } from '@/services/nac/model/observation'

export interface LocationMapProps {
  location: LatLng
  color: string
  label: string
  /** Printed in the marker when over 1, as the widget numbers a report of several avalanches. */
  count?: number | null
}

const MAP_BOX = 'h-[280px] w-full overflow-hidden rounded-lg border bg-muted'

const LocationMapCanvas = dynamic(
  () => import('./LocationMapCanvas').then((mod) => mod.LocationMapCanvas),
  { ssr: false, loading: () => <div className={MAP_BOX} /> },
)

export function LocationMap({
  location,
  ...props
}: Omit<LocationMapProps, 'location'> & { location: LatLng | null }) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  if (!location || !token) return null
  return <LocationMapCanvas location={location} token={token} className={MAP_BOX} {...props} />
}
