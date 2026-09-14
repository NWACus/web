'use client'

import { Button } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
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

// Sits above the stations list. There is no scheduled sync: a station that
// SnowObs adds waits here until someone clicks, which is a few times a decade.
export function SyncStationsButton() {
  const router = useRouter()
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [running, setRunning] = useState(false)

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
        Station names, elevations and coordinates come from SnowObs. Sync to pick up a new or
        renamed station; nothing you set here is overwritten.
      </p>
      <Button buttonStyle="secondary" size="small" disabled={running} onClick={sync}>
        {running ? 'Syncing…' : 'Sync from SnowObs'}
      </Button>
      <SyncOutcome outcome={outcome} />
    </div>
  )
}
