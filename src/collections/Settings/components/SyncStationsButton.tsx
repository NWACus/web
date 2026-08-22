'use client'

import { Button, FieldLabel, useDocumentInfo } from '@payloadcms/ui'
import { useState } from 'react'

type Outcome = { text: string; failed: boolean }

export async function runSync(id: number | string): Promise<Outcome> {
  try {
    const response = await fetch(`/api/settings/${id}/sync-stations`, {
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

// Runs the same sync the hourly cron runs, so a new source or token can be
// checked the moment it is saved rather than an hour later.
export function SyncStationsButton() {
  const { id } = useDocumentInfo()
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [running, setRunning] = useState(false)

  const sync = async () => {
    if (!id) return
    setRunning(true)
    setOutcome(await runSync(id))
    setRunning(false)
  }

  return (
    <div className="field-type snowobs-sync">
      <FieldLabel label="Station sync" />
      <p className="snowobs-sync__hint">
        Stations sync hourly. Save first, then sync here to check a new source or token.
      </p>
      <Button buttonStyle="secondary" disabled={!id || running} onClick={sync}>
        {running ? 'Syncing…' : 'Sync now'}
      </Button>
      <SyncOutcome outcome={outcome} />
    </div>
  )
}
