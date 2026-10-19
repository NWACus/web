'use client'

import { columnsFromReported } from '@/services/snowobs/deriveColumns'
import type { StationEntry } from '@/services/stations/stationColumns'
import {
  readingLabel,
  readingName,
  readingsSummary,
  showsReading,
  withShownReadings,
} from '@/services/stations/stationColumns'
import { cn } from '@/utilities/ui'
import { Button } from '@payloadcms/ui'

// What a station can show: its latest report plus any reading it already chose or hid, which may
// have gone quiet since. Table-ordered, battery excluded.
export function readingChoices(entry: StationEntry, reported: string[]): string[] {
  const variables = new Set([...reported, ...(entry.columns ?? []), ...(entry.hidden ?? [])])
  return columnsFromReported([entry], () => variables).map((c) => c.variable)
}

function shownReadings(entry: StationEntry, choices: string[]): Set<string> {
  return new Set(choices.filter((v) => showsReading(entry, v)))
}

// The station with one reading turned off, keeping whether new readings show.
export function withoutReading(
  entry: StationEntry,
  reported: string[],
  variable: string,
): StationEntry {
  const choices = readingChoices(entry, reported)
  const shown = shownReadings(entry, choices)
  shown.delete(variable)
  return withShownReadings(entry, choices, shown, !entry.columns)
}

export function ColumnsSummary({ entry, reported }: { entry: StationEntry; reported: string[] }) {
  const { all, labels } = readingsSummary(entry, readingChoices(entry, reported))
  return (
    <span className="stations-columns__summary">
      {labels.map((label) => (
        <span
          key={label}
          className={cn('stations-columns__pill', all && 'stations-columns__pill--auto')}
        >
          {label}
        </span>
      ))}
    </span>
  )
}

type EditorProps = {
  id: string
  entry: StationEntry
  reported: string[]
  onChange: (entry: StationEntry) => void
}

// One line of bulk actions, then a checkbox per reading.
function StationColumnsEditor({ id, entry, reported, onChange }: EditorProps) {
  const choices = readingChoices(entry, reported)
  const reporting = new Set(reported)
  const shown = shownReadings(entry, choices)
  const showNew = !entry.columns
  const save = (next: ReadonlySet<string>, nextShowNew = showNew) =>
    onChange(withShownReadings(entry, choices, next, nextShowNew))
  const toggle = (variable: string, on: boolean) => {
    const next = new Set(shown)
    if (on) next.add(variable)
    else next.delete(variable)
    save(next)
  }
  if (choices.length === 0) {
    return (
      <p className="stations-columns__none">
        SnowObs has no recent report from this station, so there are no readings to choose from. It
        shows every reading it reports.
      </p>
    )
  }
  return (
    <div className="stations-columns">
      <div className="stations-columns__actions">
        <Button
          buttonStyle="none"
          className="stations-columns__link"
          onClick={() => save(new Set(choices))}
        >
          Show all
        </Button>
        <Button
          buttonStyle="none"
          className="stations-columns__link"
          onClick={() => save(new Set())}
        >
          Hide all
        </Button>
        <label htmlFor={`${id}-new`} className="stations-columns__new">
          <input
            id={`${id}-new`}
            type="checkbox"
            checked={showNew}
            onChange={(e) => save(shown, e.target.checked)}
          />
          Show readings this station starts reporting later
        </label>
      </div>
      <div className="stations-columns__list">
        {choices.map((variable) => (
          <label key={variable} htmlFor={`${id}-${variable}`} title={variable}>
            <input
              id={`${id}-${variable}`}
              type="checkbox"
              checked={shown.has(variable)}
              onChange={(e) => toggle(variable, e.target.checked)}
            />
            {readingName(variable)}
            <span className="stations-columns__code">{readingLabel(variable)}</span>
            {!reporting.has(variable) && (
              <span className="stations-columns__quiet">not in latest report</span>
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
