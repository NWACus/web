'use client'

import { Button } from '@payloadcms/ui'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

type Outcome = { text: string; failed: boolean }

export async function runSync(): Promise<Outcome> {
  try {
    const response = await fetch('/api/stations/sync', {
      method: 'POST',
      credentials: 'include',
    })
    const body = await response.json()
    if (!response.ok) return { text: body.error ?? 'Sync failed.', failed: true }
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
// above the search bar. One direction only: SnowObs' identity fields are
// copied over the row, NWAC's own fields are never touched, and nothing is
// deleted. There is no schedule: a station SnowObs adds waits here until
// someone clicks, which is a few times a decade.
export function SyncStationsButton() {
  const router = useRouter()
  const pathname = usePathname()
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [running, setRunning] = useState(false)

  // The description slot is shared with the edit view; the button belongs on
  // the list only.
  const onList = /\/collections\/stations\/?$/.test(pathname ?? '')

  const sync = async () => {
    setRunning(true)
    const result = await runSync()
    setOutcome(result)
    setRunning(false)
    if (!result.failed) router.refresh()
  }

  return (
    <div className="snowobs-sync">
      <p className="snowobs-sync__hint">
        Every station SnowObs holds for this center. Names, elevations and coordinates come from
        SnowObs and are read-only; assign a page and any flags here.
      </p>
      {onList && (
        <div className="snowobs-sync__action">
          <Button buttonStyle="secondary" disabled={running} onClick={sync}>
            {running ? 'Updating…' : 'Update from SnowObs'}
          </Button>
          <SyncOutcome outcome={outcome} />
        </div>
      )}
    </div>
  )
}
