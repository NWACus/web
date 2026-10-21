'use client'

import { columnsFromReported } from '@/services/snowobs/deriveColumns'
import type { StationEntry } from '@/services/stations/stationColumns'
import {
  formatLastReported,
  readingLabel,
  readingName,
  readingsSummary,
  withHiddenReadings,
} from '@/services/stations/stationColumns'
import { Button } from '@payloadcms/ui'

// What a station can show: its readings in the table's default window plus any it hid, which may
// have gone quiet since. Table-ordered, battery excluded.
export function readingChoices(entry: StationEntry, reported: string[]): string[] {
  const variables = new Set([...reported, ...(entry.hidden ?? [])])
  return columnsFromReported([entry], () => variables).map((c) => c.variable)
}

// The station with its hidden readings set to `hide`, kept in table order.
function hiding(entry: StationEntry, choices: string[], hide: ReadonlySet<string>): StationEntry {
  return withHiddenReadings(
    entry,
    choices.filter((v) => hide.has(v)),
  )
}

export function withoutReading(
  entry: StationEntry,
  reported: string[],
  variable: string,
): StationEntry {
  return hiding(
    entry,
    readingChoices(entry, reported),
    new Set([...(entry.hidden ?? []), variable]),
  )
}

export function ColumnsSummary({ entry, reported }: { entry: StationEntry; reported: string[] }) {
  return (
    <span className="stations-columns__pill stations-columns__pill--auto">
      {readingsSummary(entry, readingChoices(entry, reported))}
    </span>
  )
}

type EditorProps = {
  id: string
  entry: StationEntry
  reported: string[]
  /** Set when the station is silent and `reported` is from the last day it reported. */
  lastReported: string | null
  onChange: (entry: StationEntry) => void
}

// Show all and Hide all, then a checkbox per reading. A new reading always shows until hidden.
function StationColumnsEditor({ id, entry, reported, lastReported, onChange }: EditorProps) {
  const choices = readingChoices(entry, reported)
  const reporting = new Set(reported)
  const hidden = new Set(entry.hidden ?? [])
  const save = (hide: ReadonlySet<string>) => onChange(hiding(entry, choices, hide))
  const toggle = (variable: string, show: boolean) => {
    const next = new Set(hidden)
    if (show) next.delete(variable)
    else next.add(variable)
    save(next)
  }
  if (choices.length === 0) {
    return (
      <p className="stations-columns__none">
        SnowObs has no report from this station, so there are no readings to choose from. It shows
        every reading it reports.
      </p>
    )
  }
  return (
    <div className="stations-columns">
      {lastReported && (
        <p className="stations-columns__none">
          Last reported {formatLastReported(lastReported)}. These are its readings from that day;
          the table shows them again once it reports.
        </p>
      )}
      <div className="stations-columns__actions">
        <Button
          buttonStyle="none"
          className="stations-columns__link"
          onClick={() => save(new Set())}
        >
          Show all
        </Button>
        <Button
          buttonStyle="none"
          className="stations-columns__link"
          onClick={() => save(new Set(choices))}
        >
          Hide all
        </Button>
      </div>
      <div className="stations-columns__list">
        {choices.map((variable) => (
          <label key={variable} htmlFor={`${id}-${variable}`} title={variable}>
            <input
              id={`${id}-${variable}`}
              type="checkbox"
              checked={!hidden.has(variable)}
              onChange={(e) => toggle(variable, e.target.checked)}
            />
            {readingName(variable)}
            <span className="stations-columns__code">{readingLabel(variable)}</span>
            {!reporting.has(variable) && (
              <span className="stations-columns__quiet">nothing in the last 24 hours</span>
            )}
          </label>
        ))}
      </div>
    </div>
  )
}

// A full-width row under the station's own; `span` is the table's column count minus the first.
export function ColumnsDrawer({ span, ...props }: EditorProps & { span: number }) {
  return (
    <tr className="stations-table__drawer">
      <td />
      <td colSpan={span}>
        <StationColumnsEditor {...props} />
      </td>
    </tr>
  )
}
