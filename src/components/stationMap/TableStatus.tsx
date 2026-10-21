/**
 * What the table says about its data: the map's loading and failure messages (`./MapStatus`), in
 * the page's flow rather than over a canvas.
 */
import type { StationMapData } from '@/services/snowobs/stationMap/model'

/** Before any data: loading, or a failure there is nothing to show behind. */
function FirstLoadStatus({ failed, loading }: { failed: boolean; loading: boolean }) {
  if (failed) {
    return (
      <p role="alert" className="py-8 text-center text-sm text-muted-foreground">
        Weather station data is unavailable right now.
      </p>
    )
  }
  return loading ? (
    <p className="py-8 text-center text-sm text-muted-foreground">Loading weather stations…</p>
  ) : null
}

/** Loaded, but with no row to show: say why rather than leave a bare header. */
function EmptyStatus({ data }: { data: StationMapData }) {
  return (
    <p role="status" className="py-8 text-center text-sm text-muted-foreground">
      {data.stations.length === 0
        ? 'No weather stations are reporting right now.'
        : 'No stations match these filters.'}
    </p>
  )
}

export function TableStatus({
  data,
  failed,
  loading,
  visibleCount,
}: {
  data: StationMapData | null
  failed: boolean
  loading: boolean
  /** Stations passing the filters. */
  visibleCount: number
}) {
  if (!data) return <FirstLoadStatus failed={failed} loading={loading} />
  return (
    <>
      {failed && (
        <p role="status" className="text-xs text-muted-foreground">
          Couldn&apos;t refresh station data; showing the last readings loaded.
        </p>
      )}
      {visibleCount === 0 && <EmptyStatus data={data} />}
    </>
  )
}
