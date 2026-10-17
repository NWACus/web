'use client'

import { toStationEntries } from '@/fields/stations'
import type { TrackedStations } from '@/fields/stations/useTrackedStations'
import { useCenterSlug, useTrackedStations } from '@/fields/stations/useTrackedStations'
import { columnsFromReported } from '@/services/snowobs/deriveColumns'
import { stationKey } from '@/services/snowobs/stationKey'
import type { StationColumnConfig } from '@/services/snowobs/tableHelpers'
import {
  columnKey,
  orderColumns,
  orderToSave,
  readingLabel,
  selectColumns,
  toColumnOrder,
  toColumnOrderEntries,
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
  useFormFields,
} from '@payloadcms/ui'
import type { JSONFieldClientProps } from 'payload'
import { useEffect, useRef } from 'react'

type Ref = { stid: string; source: string }

// When the stations change under a custom order, save the order as shown, so a
// ticked reading keeps its place even if the column it sits after goes quiet.
function useSyncCustomOrder(stationsKey: string, ready: boolean, sync: () => void) {
  const seen = useRef<string | null>(null)
  useEffect(() => {
    if (!ready) return
    const previous = seen.current
    seen.current = stationsKey
    if (previous !== null && previous !== stationsKey) sync()
  }, [stationsKey, ready, sync])
}

function ColumnChips({
  columns,
  name,
  onMove,
}: {
  columns: StationColumnConfig[]
  name: (ref: Ref) => string
  onMove: (from: number, to: number) => void
}) {
  const ids = columns.map((c) => columnKey(c.station, c.variable))
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

// Why there are no chips to show, or null when there are.
function statusNote(tracked: TrackedStations, hasColumns: boolean): string | null {
  if (tracked.status === 'error') {
    return `Could not load the SnowObs list (${tracked.message}), so the columns cannot be shown or reordered until it is back.`
  }
  const notes = {
    loading: 'Loading readings from SnowObs…',
    ready: hasColumns ? null : 'Add a station to see its columns here.',
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
    columns: orderColumns(live, stored),
    isCustom: stored.length > 0,
    name: (ref: Ref) => byKey.get(stationKey(ref))?.name ?? ref.stid,
    silent: entries.filter((e) => !e.columns && reported(e).length === 0),
  }
}

// The page's table columns, one per station and reading, as sortable chips.
// Which columns exist comes from the stations field and SnowObs's latest
// reports; this field only stores their order, and stores nothing while it is
// the default.
export function ColumnOrderInput({ path, field }: JSONFieldClientProps) {
  const { value, setValue, showError, errorMessage } = useField<unknown>({ path })
  const stationsValue = useFormFields(([fields]) => fields.stations?.value)
  const { tracked, entries, live, columns, isCustom, name, silent } = useColumnOrder(
    value,
    stationsValue,
  )
  useSyncCustomOrder(JSON.stringify(entries), tracked.status === 'ready', () => {
    if (isCustom) setValue(toColumnOrderEntries(columns))
  })

  const note = statusNote(tracked, columns.length > 0)
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
            onMove={(from, to) => setValue(orderToSave(arrayMove(columns, from, to), live))}
          />
          <OrderMeta count={columns.length} isCustom={isCustom} onReset={() => setValue([])} />
          <SilentNote names={silent.map(name)} />
        </>
      )}
      <FieldError path={path} message={errorMessage} showError={showError} />
    </div>
  )
}
