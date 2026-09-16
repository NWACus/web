'use client'

import { Button } from '@payloadcms/ui'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

import { useTenantSelection } from '@/providers/TenantSelectionProvider/index.client'

type Outcome = { text: string; failed: boolean }

export async function runSync(): Promise<Outcome> {
  try {
    const response = await fetch('/api/stations/sync', {
      method: 'POST',
      credentials: 'include',
    })
    const body = await response.json()
    if (!response.ok) return { text: body.error ?? 'Update from SnowObs failed.', failed: true }
    return {
      text: `${body.created} added, ${body.updated} updated, ${body.unchanged} unchanged.`,
      failed: false,
    }
  } catch {
    return { text: 'Could not reach the server.', failed: true }
  }
}

// Takes the collection description's slot, so it lands under the title and
// above the search bar. Nothing runs on its own: an admin presses the button
// when a station SnowObs added should appear, which is a few times a season.
// The button needs a center, because the sync reads the selected center's
// SnowObs source and token, so it only shows once one is picked. One direction
// only: SnowObs' identity fields are copied over the row, NWAC's own fields are
// never touched, and nothing is deleted.
export function SyncStationsButton() {
  const router = useRouter()
  const pathname = usePathname()
  const { selectedTenantSlug } = useTenantSelection()
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
        Every station SnowObs tracks for this center. Names, elevations and coordinates come from
        SnowObs and are read-only; assign a page and any flags here.
      </p>
      {onList && selectedTenantSlug && (
        <div className="snowobs-sync__action">
          <Button buttonStyle="secondary" disabled={running} onClick={sync}>
            {running ? 'Updating…' : 'Update from SnowObs'}
          </Button>
          {outcome && (
            <p
              className={`snowobs-sync__outcome snowobs-sync__outcome--${outcome.failed ? 'bad' : 'good'}`}
            >
              {outcome.text}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
