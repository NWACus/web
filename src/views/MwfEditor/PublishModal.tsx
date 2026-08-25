'use client'

// The publish gate. Validation runs against the live editor model: every
// visible field for the issuance must be filled (density only where QPF > 0,
// over-precise QPF flagged) — anything missing blocks publish and is
// summarized by section. A valid forecast publishes now or on a schedule (a
// future issue time embargoes it: the prior revision keeps serving until the
// scheduled time arrives).
import {
  MwfForecast,
  summarizeMissing,
  validateForecast,
  type ForecastPoint,
  type Zone,
} from '@/utilities/mwf/mwfData'
import { Button } from '@payloadcms/ui'
import { useMemo, useState } from 'react'

export interface PublishModalProps {
  forecast: MwfForecast
  zones: Zone[]
  points: ForecastPoint[]
  extendedZones: Zone[]
  isCorrection: boolean
  busy: boolean
  onConfirm: (issuedAt: string) => void
  onClose: () => void
}

export function PublishModal({
  forecast,
  zones,
  points,
  extendedZones,
  isCorrection,
  busy,
  onConfirm,
  onClose,
}: PublishModalProps) {
  const [mode, setMode] = useState<'now' | 'schedule'>('now')
  const [scheduledFor, setScheduledFor] = useState(forecast.meta.issued)

  const missing = useMemo(
    () => validateForecast(forecast, { zones, points, extendedZones }),
    [forecast, zones, points, extendedZones],
  )
  const summary = useMemo(() => summarizeMissing(missing), [missing])
  const blocked = missing.length > 0

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isCorrection ? 'Publish correction' : 'Publish forecast'}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div className="w-full max-w-lg rounded-lg border bg-white p-5 shadow-xl dark:bg-neutral-900">
        <h2 className="text-lg font-semibold">
          {isCorrection ? 'Publish correction' : 'Publish forecast'}
        </h2>
        <p className="mb-4 text-sm opacity-70">
          {forecast.meta.initialDate} · {forecast.meta.type}
          {isCorrection ? ' · supersedes the published revision' : ''}
        </p>

        {blocked ? (
          <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm dark:bg-red-950/30">
            <p className="mb-1 font-medium">
              Publish is blocked — {missing.length} field{missing.length === 1 ? '' : 's'} missing:
            </p>
            <ul className="list-disc pl-5">
              {summary.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="mb-4 flex flex-col gap-2 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="publish-when"
                checked={mode === 'now'}
                onChange={() => setMode('now')}
              />
              Publish now
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="publish-when"
                checked={mode === 'schedule'}
                onChange={() => setMode('schedule')}
              />
              Schedule for
              <input
                type="datetime-local"
                aria-label="Scheduled publish time"
                className="rounded border px-1.5 py-0.5"
                value={scheduledFor}
                disabled={mode !== 'schedule'}
                onChange={(e) => setScheduledFor(e.target.value)}
              />
            </label>
            {mode === 'schedule' && (
              <p className="text-xs opacity-70">
                The forecast stays embargoed until this time; the prior revision keeps serving until
                it goes live.
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button buttonStyle="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              onConfirm(mode === 'schedule' ? scheduledFor : new Date().toISOString().slice(0, 16))
            }
            disabled={blocked || busy}
          >
            {busy ? 'Publishing…' : mode === 'schedule' ? 'Schedule publish' : 'Publish'}
          </Button>
        </div>
      </div>
    </div>
  )
}
