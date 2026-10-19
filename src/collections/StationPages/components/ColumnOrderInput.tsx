'use client'

import { toStationEntries } from '@/fields/stations'
import { withoutReading } from '@/fields/stations/StationColumnsEditor'
import type { TrackedStations } from '@/fields/stations/useTrackedStations'
import { useCenterSlug, useTrackedStations } from '@/fields/stations/useTrackedStations'
import { columnsFromReported } from '@/services/snowobs/deriveColumns'
import { stationKey } from '@/services/snowobs/stationKey'
import type { StationColumnConfig } from '@/services/snowobs/tableHelpers'
import {
  columnKey,
  mergeOrder,
  orderColumns,
  orderToSave,
  readingLabel,
  selectColumns,
  toColumnOrder,
} from '@/services/stations/stationColumns'
import { cn } from '@/utilities/ui'
import { arrayMove } from '@dnd-kit/sortable'
import {
  Button,
  DraggableSortable,
  DraggableSortableItem,
  FieldDescription,
  FieldError,
  FieldLabel,
  useField,
  XIcon,
} from '@payloadcms/ui'
import type { JSONFieldClientProps } from 'payload'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'

type Ref = { stid: string; source: string }

export type ColumnOrderInputClientProps = { stationsPath: string }

// When the stations change under a custom order, save the order as shown, so a
// ticked reading keeps its place even if the column it sits after goes quiet.
function useSyncCustomOrder(stationsKey: string, ready: boolean, sync: () => void) {
  const seen = useRef<string | null>(null)
  const latestSync = useRef(sync)
  useLayoutEffect(() => {
    latestSync.current = sync
  })
  useEffect(() => {
    if (!ready) return
    const previous = seen.current
    seen.current = stationsKey
    if (previous !== null && previous !== stationsKey) latestSync.current()
  }, [stationsKey, ready])
}

function ColumnChips({
  columns,
  name,
  onMove,
  onRemove,
}: {
  columns: StationColumnConfig[]
  name: (ref: Ref) => string
  onMove: (from: number, to: number) => void
  onRemove: (column: StationColumnConfig) => void
}) {
  const ids = columns.map((c) => columnKey(c.station, c.variable))
  if (ids.length === 0) return null
  return (
    <DraggableSortable
      ids={ids}
      onDragEnd={({ moveFromIndex, moveToIndex }) => onMove(moveFromIndex, moveToIndex)}
      className="column-order-input__list"
    >
      {columns.map((column, i) => (
        <DraggableSortableItem key={ids[i]} id={ids[i]}>
          {({ attributes, isDragging, listeners, setNodeRef, transform, transition }) => (
            // Spread first: `attributes` carries its own style, which would drop the transform.
            <div
              {...attributes}
              {...listeners}
              // dnd-kit makes the chip a button; a group can hold the remove button.
              role="group"
              aria-label={`${readingLabel(column.variable)}, ${name(column.station)}, column ${i + 1}`}
              ref={setNodeRef}
              style={{ ...attributes.style, transform, transition }}
              className={cn(
                'column-order-input__chip',
                isDragging && 'column-order-input__chip--dragging',
              )}
              title={`${column.station.stid} · ${column.variable}`}
            >
              <span className="column-order-input__n">{i + 1}</span>
              {readingLabel(column.variable)}
              <span className="column-order-input__station">{name(column.station)}</span>
              <button
                type="button"
                className="column-order-input__remove"
                aria-label={`Remove ${readingLabel(column.variable)} for ${name(column.station)}`}
                title="Remove this column (unticks the reading on its station)"
                // Keep a press on the button from starting a drag of the chip.
                onMouseDown={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                onClick={() => onRemove(column)}
              >
                <XIcon />
              </button>
            </div>
          )}
        </DraggableSortableItem>
      ))}
    </DraggableSortable>
  )
}

function SilentNote({ names }: { names: string[] }) {
  if (names.length === 0) return null
  const one = names.length === 1
  return (
    <p className="column-order-input__note">
      {names.join(', ')} {one ? 'has' : 'have'} no recent report, so{' '}
      {one ? 'its columns are' : 'their columns are'} not listed yet.
    </p>
  )
}

// Why there are no chips to show, or null when there are (or the stations simply have none).
function statusNote(tracked: TrackedStations, hasStations: boolean): string | null {
  if (tracked.status === 'error') {
    return `Could not load the SnowObs list (${tracked.message}), so the columns cannot be shown or reordered until it is back.`
  }
  const notes = {
    loading: 'Loading readings from SnowObs…',
    ready: hasStations ? null : 'Add a station to see its columns here.',
  }
  return notes[tracked.status]
}

function OrderMeta({
  count,
  isCustom,
  onReset,
}: {
  count: number
  isCustom: boolean
  onReset: () => void
}) {
  return (
    <div className="column-order-input__meta">
      <span>
        {count} columns · {isCustom ? 'Custom order' : 'Default order'}
      </span>
      {isCustom && (
        <Button buttonStyle="none" className="column-order-input__reset" onClick={onReset}>
          Reset to default order
        </Button>
      )}
    </div>
  )
}

// The stations' live columns in the stored order, with SnowObs's names for the chips.
function useColumnOrder(value: unknown, stationsValue: unknown) {
  const tracked = useTrackedStations(useCenterSlug())
  const entries = toStationEntries(stationsValue)
  const byKey = new Map(tracked.stations.map((s) => [stationKey(s), s]))
  const reported = (s: Ref) => byKey.get(stationKey(s))?.variables ?? []
  const live = selectColumns(columnsFromReported(entries, reported), entries)
  const stored = toColumnOrder(value)
  return {
    tracked,
    entries,
    live,
    stored,
    columns: orderColumns(live, stored),
    isCustom: stored.length > 0,
    name: (ref: Ref) => byKey.get(stationKey(ref))?.name ?? ref.stid,
    silent: entries.filter((e) => !e.columns && reported(e).length === 0),
    reported,
  }
}

// The table's columns as sortable chips. Only their order is stored, and nothing while it's the
// default; which columns exist comes from the stations field (see ADR 021).
export function ColumnOrderInput({
  path,
  field,
  stationsPath,
}: JSONFieldClientProps & ColumnOrderInputClientProps) {
  const { value, setValue, showError, errorMessage } = useField<unknown>({ path })
  const stationsField = useField<unknown>({ path: stationsPath })
  const { tracked, entries, live, stored, columns, isCustom, name, silent, reported } =
    useColumnOrder(value, stationsField.value)
  const removeColumn = ({ station, variable }: StationColumnConfig) =>
    stationsField.setValue(
      entries.map((e) =>
        stationKey(e) === stationKey(station) ? withoutReading(e, reported(e), variable) : e,
      ),
    )
  const stationsKey = useMemo(
    () => JSON.stringify(toStationEntries(stationsField.value)),
    [stationsField.value],
  )
  useSyncCustomOrder(stationsKey, tracked.status === 'ready', () => {
    if (isCustom) setValue(mergeOrder(stored, columns, entries))
  })

  const note = statusNote(tracked, entries.length > 0)
  return (
    <div className="field-type json column-order-input mb-6">
      <FieldLabel htmlFor={path} label={field.label} required={field.required} />
      <FieldDescription path={path} description={field.admin?.description} />
      {note && <p className="column-order-input__note">{note}</p>}
      {!note && (
        <>
          <ColumnChips
            columns={columns}
            name={name}
            onRemove={removeColumn}
            onMove={(from, to) =>
              setValue(orderToSave(arrayMove(columns, from, to), live, stored, entries))
            }
          />
          <OrderMeta count={columns.length} isCustom={isCustom} onReset={() => setValue([])} />
          <SilentNote names={silent.map(name)} />
        </>
      )}
      <FieldError path={path} message={errorMessage} showError={showError} />
    </div>
  )
}
