/**
 * What the map says about its data: a cover while the stations load or if they never arrive, and
 * quiet notices for the parts that degraded on their own.
 */
import type { ReactNode } from 'react'

import type { StationMapData } from '@/services/snowobs/stationMap/model'

function MapOverlay({ children }: { children: ReactNode }) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/80 text-sm text-muted-foreground">
      {children}
    </div>
  )
}

function Notice({ children }: { children: ReactNode }) {
  return (
    <div role="status" className="rounded bg-white/95 px-2 py-1 text-xs text-neutral-700 shadow">
      {children}
    </div>
  )
}

/** Covers the map while the stations load, and stays up if they never arrive. */
function LoadingCover({ failed, loading }: { failed: boolean; loading: boolean }) {
  if (failed) {
    return (
      <MapOverlay>
        <span role="alert">Weather station data is unavailable right now.</span>
      </MapOverlay>
    )
  }
  return loading ? (
    <MapOverlay>
      <span>Loading weather stations…</span>
    </MapOverlay>
  ) : null
}

interface MapStatusProps {
  data: StationMapData | null
  failed: boolean
  loading: boolean
  /** The browser has no WebGL; the station list below the map is the whole product. */
  unsupported: boolean
}

/** The parts that degraded on their own while the stations still show. */
function Notices({ data, failed }: { data: StationMapData; failed: boolean }) {
  return (
    <div className="absolute bottom-2 right-2 z-10 flex flex-col items-end gap-1">
      {failed && (
        <Notice>Couldn&apos;t refresh station data; showing the last readings loaded.</Notice>
      )}
      {data.webcamsUnavailable && <Notice>Webcams are unavailable right now.</Notice>}
    </div>
  )
}

export function MapStatus({ data, failed, loading, unsupported }: MapStatusProps) {
  if (unsupported) {
    return (
      <MapOverlay>
        <span role="alert">
          This browser can&apos;t display the map. The stations are listed below.
        </span>
      </MapOverlay>
    )
  }
  if (!data) return <LoadingCover failed={failed} loading={loading} />
  return <Notices data={data} failed={failed} />
}
