'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

type Outcome = { text: string; failed: boolean }

// `null` when the server judged the last sync fresh enough and did nothing.
export async function runSync(): Promise<Outcome | null> {
  try {
    const response = await fetch('/api/stations/sync?ifStale', {
      method: 'POST',
      credentials: 'include',
    })
    const body = await response.json()
    if (!response.ok) return { text: body.error ?? 'Update from SnowObs failed.', failed: true }
    if (body.skipped) return null
    return {
      text: `Updated from SnowObs: ${body.created} added, ${body.updated} updated, ${body.unchanged} unchanged.`,
      failed: false,
    }
  } catch {
    return { text: 'Could not reach the server to update from SnowObs.', failed: true }
  }
}

// Takes the collection description's slot, so it lands under the title and
// above the search bar. Opening the list syncs from SnowObs when the last run
// is a day old, so a station SnowObs adds shows up without anyone remembering
// to ask; there is no control to press. One direction only: SnowObs' identity
// fields are copied over the row, NWAC's own fields are never touched, and
// nothing is deleted.
export function StationsSyncOnOpen() {
  const router = useRouter()
  const pathname = usePathname()
  const [status, setStatus] = useState<Outcome | null>(null)
  const [running, setRunning] = useState(false)
  const openedOnce = useRef(false)

  // The description slot is shared with the edit view; the sync belongs on
  // the list only.
  const onList = /\/collections\/stations\/?$/.test(pathname ?? '')

  useEffect(() => {
    if (!onList || openedOnce.current) return
    openedOnce.current = true
    setRunning(true)
    void runSync().then((result) => {
      setRunning(false)
      if (!result) return
      setStatus(result)
      if (!result.failed) router.refresh()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per list open
  }, [onList])

  const tone = status?.failed ? 'bad' : 'good'

  return (
    <div className="snowobs-sync">
      <p className="snowobs-sync__hint">
        Every station SnowObs tracks for this center, refreshed from SnowObs when this list opens.
        Names, elevations and coordinates are read-only; assign a page and any flags here.
      </p>
      {running && <p className="snowobs-sync__outcome">Updating from SnowObs…</p>}
      {!running && status && (
        <p className={`snowobs-sync__outcome snowobs-sync__outcome--${tone}`}>{status.text}</p>
      )}
    </div>
  )
}
