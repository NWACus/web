'use client'

import { Button } from '@payloadcms/ui'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

type Outcome = { text: string; failed: boolean }

// `null` when the server judged the last sync fresh enough and did nothing.
export async function runSync({ ifStale = false } = {}): Promise<Outcome | null> {
  try {
    const response = await fetch(`/api/stations/sync${ifStale ? '?ifStale' : ''}`, {
      method: 'POST',
      credentials: 'include',
    })
    const body = await response.json()
    if (!response.ok) return { text: body.error ?? 'Sync failed.', failed: true }
    if (body.skipped) return null
    return {
      text: `${body.created} added, ${body.updated} updated, ${body.unchanged} unchanged.`,
      failed: false,
    }
  } catch {
    return { text: 'Could not reach the server.', failed: true }
  }
}

function SyncOutcome({ outcome }: { outcome: Outcome | null }) {
  if (!outcome) return null
  const tone = outcome.failed ? 'bad' : 'good'
  return <p className={`snowobs-sync__outcome snowobs-sync__outcome--${tone}`}>{outcome.text}</p>
}

// Takes the collection description's slot, so it lands under the title and
// above the search bar. Opening the list syncs if the last run is a day old,
// so a station SnowObs adds shows up without anyone remembering; the button
// forces a run. One direction only: SnowObs' identity fields are copied over
// the row, NWAC's own fields are never touched, and nothing is deleted.
export function SyncStationsButton() {
  const router = useRouter()
  const pathname = usePathname()
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [running, setRunning] = useState(false)
  const openedOnce = useRef(false)

  // The description slot is shared with the edit view; the sync belongs on
  // the list only.
  const onList = /\/collections\/stations\/?$/.test(pathname ?? '')

  const sync = async (options?: { ifStale: boolean }) => {
    setRunning(true)
    const result = await runSync(options)
    setRunning(false)
    if (!result) return
    setOutcome(result)
    if (!result.failed) router.refresh()
  }

  useEffect(() => {
    if (!onList || openedOnce.current) return
    openedOnce.current = true
    void sync({ ifStale: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per list open
  }, [onList])

  return (
    <div className="snowobs-sync">
      <p className="snowobs-sync__hint">
        Every station SnowObs tracks for this center. Names, elevations and coordinates come from
        SnowObs and are read-only; assign a page and any flags here.
      </p>
      {onList && (
        <div className="snowobs-sync__action">
          <Button buttonStyle="secondary" disabled={running} onClick={() => sync()}>
            {running ? 'Updating…' : 'Update from SnowObs'}
          </Button>
          <SyncOutcome outcome={outcome} />
        </div>
      )}
    </div>
  )
}
