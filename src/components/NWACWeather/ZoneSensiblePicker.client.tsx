'use client'

/**
 * The legacy nwac.us tab's "Weather Forecast" section: a zone dropdown over that zone's sensible
 * weather, one row per day. Opens on the page's own zone; any zone the issuance covers can be
 * picked.
 */
import { useId, useState } from 'react'

import type { SensibleDay, SensibleRow } from './SensibleDays.client'

export function ZoneSensiblePicker({
  days,
  rows,
  initialZone,
}: {
  days: SensibleDay[]
  rows: SensibleRow[]
  initialZone: string | undefined
}) {
  const [zone, setZone] = useState(initialZone ?? rows[0]?.key)
  const selectId = useId()
  const row = rows.find((r) => r.key === zone) ?? rows[0]
  if (!row) return null

  return (
    <section className="space-y-3">
      <h3 className="text-lg font-semibold">Weather Forecast</h3>
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={selectId} className="text-sm text-muted-foreground">
          Use dropdown to select your zone
        </label>
        <select
          id={selectId}
          value={row.key}
          onChange={(e) => setZone(e.target.value)}
          className="h-9 rounded-md border bg-background px-2 text-sm"
        >
          {rows.map((r) => (
            <option key={r.key} value={r.key}>
              {r.zone}
            </option>
          ))}
        </select>
      </div>
      <table className="w-full border-collapse text-sm">
        <tbody>
          {days.map((d) => (
            <tr key={d.key} className="border-b last:border-b-0">
              <th scope="row" className="w-40 p-2 text-left align-top font-semibold">
                {d.label}
                {d.date && (
                  <span className="block text-xs font-normal text-muted-foreground">{d.date}</span>
                )}
              </th>
              <td className="p-2 align-top">{row.text[d.key] || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
