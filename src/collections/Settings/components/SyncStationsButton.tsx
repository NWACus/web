'use client'

import { Button, useDocumentInfo } from '@payloadcms/ui'
import { useState } from 'react'

type Outcome = { text: string; failed: boolean }

const IDLE = 'Stations sync hourly. Save your changes first, then run it here to check a new token.'

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

// Runs the same sync the hourly cron runs, so a token can be checked the moment
// it is pasted in rather than an hour later. Save first: the endpoint reads the
// stored source and token, not what is currently typed into the form.
export function SyncStationsButton() {
  const { id } = useDocumentInfo()
  const [outcome, setOutcome] = useState<Outcome>({ text: IDLE, failed: false })
  const [running, setRunning] = useState(false)

  const sync = async () => {
    if (!id) return
    setRunning(true)
    setOutcome(await runSync(id))
    setRunning(false)
  }

  return (
    <div className="field-type">
      <Button buttonStyle="secondary" disabled={!id || running} onClick={sync} size="small">
        {running ? 'Syncing…' : 'Sync stations now'}
      </Button>
      <p
        style={{
          color: outcome.failed ? 'var(--theme-error-500)' : 'var(--theme-elevation-600)',
          marginTop: 'calc(var(--base) * 0.25)',
        }}
      >
        {outcome.text}
      </p>
    </div>
  )
}
