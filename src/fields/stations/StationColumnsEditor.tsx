'use client'

import { columnsFromReported } from '@/services/snowobs/deriveColumns'
import type { StationEntry } from '@/services/stations/stationColumns'
import { readingLabel } from '@/services/stations/stationColumns'
import { cn } from '@/utilities/ui'

// The readings a station can choose from: what its latest report has, plus any
// it already chose that have since gone quiet. Table-ordered, battery excluded.
export function readingChoices(entry: StationEntry, reported: string[]): string[] {
  const variables = new Set([...reported, ...(entry.columns ?? [])])
  return columnsFromReported([entry], () => variables).map((c) => c.variable)
}

export function ColumnsSummary({ entry, reported }: { entry: StationEntry; reported: string[] }) {
  if (!entry.columns) {
    const count = readingChoices(entry, reported).length
    return (
      <span className="stations-columns__pill stations-columns__pill--auto">
        All readings{count > 0 ? ` · ${count}` : ''}
      </span>
    )
  }
  if (entry.columns.length === 0) return <span className="stations-columns__none">None</span>
  const chosen = new Set(entry.columns)
  return (
    <span className="stations-columns__summary">
      {readingChoices(entry, reported)
        .filter((v) => chosen.has(v))
        .map((v) => (
          <span key={v} className="stations-columns__pill" title={v}>
            {readingLabel(v)}
          </span>
        ))}
    </span>
  )
}

// Show everything the station reports, or pick readings from it.
function StationColumnsEditor({
  id,
  entry,
  reported,
  onChange,
}: {
  id: string
  entry: StationEntry
  reported: string[]
  onChange: (columns: string[] | undefined) => void
}) {
  const choices = readingChoices(entry, reported)
  const reporting = new Set(reported)
  const chosen = new Set(entry.columns ?? choices)
  const toggle = (variable: string) => {
    const next = new Set(chosen)
    if (next.has(variable)) next.delete(variable)
    else next.add(variable)
    onChange(choices.filter((v) => next.has(v)))
  }
  return (
    <div className="stations-columns">
      <div className="stations-columns__modes" role="radiogroup">
        <label>
          <input
            type="radio"
            name={`${id}-mode`}
            checked={!entry.columns}
            onChange={() => onChange(undefined)}
          />{' '}
          Show every reading it reports
        </label>
        <label>
          <input
            type="radio"
            name={`${id}-mode`}
            checked={Boolean(entry.columns)}
            onChange={() => onChange(choices)}
          />{' '}
          Choose readings
        </label>
      </div>
      {choices.length === 0 ? (
        <p className="stations-columns__none">
          SnowObs has no recent report from this station, so there are no readings to choose from.
        </p>
      ) : (
        <div className="stations-columns__chips">
          {choices.map((variable) => (
            <button
              key={variable}
              type="button"
              className={cn(
                'stations-columns__chip',
                !reporting.has(variable) && 'stations-columns__chip--quiet',
              )}
              aria-pressed={chosen.has(variable)}
              disabled={!entry.columns}
              title={reporting.has(variable) ? variable : `${variable} · not in its latest report`}
              onClick={() => toggle(variable)}
            >
              {readingLabel(variable)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// A full-width row under the station's own, spanning the stations table.
export function ColumnsDrawer(props: Parameters<typeof StationColumnsEditor>[0]) {
  return (
    <tr className="stations-table__drawer">
      <td />
      <td colSpan={9}>
        <StationColumnsEditor {...props} />
      </td>
    </tr>
  )
}
