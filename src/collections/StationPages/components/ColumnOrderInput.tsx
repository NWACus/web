'use client'

import { toStationEntries } from '@/fields/stations'
import { withoutReading } from '@/fields/stations/StationColumnsEditor'
import type { ReportedReadings } from '@/fields/stations/useReportedReadings'
import { useReportedReadings } from '@/fields/stations/useReportedReadings'
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

type Ref = { stid: string; source: string }

export type ColumnOrderInputClientProps = { stationsPath: string }

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
                title="Hide this reading on its station"
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
      {names.join(', ')} reported nothing in the last 24 hours, so{' '}
      {one ? 'its columns are' : 'their columns are'} not listed.
    </p>
  )
}

const LOADING = 'Loading readings from SnowObs…'
const NOTES: Record<ReportedReadings['status'], (r: ReportedReadings) => string | null> = {
  error: (r) =>
    `Could not load the stations' readings from SnowObs (${r.message}), so the columns cannot be shown or reordered until it is back.`,
  idle: () => LOADING,
  loading: () => LOADING,
  ready: () => null,
}

// Why there are no chips to show; a reload after a station is added keeps the chips up.
function statusNote(readings: ReportedReadings, hasStations: boolean, hasColumns: boolean) {
  if (!hasStations) return 'Add a station to see its columns here.'
  if (hasColumns && readings.status === 'loading') return null
  return NOTES[readings.status](readings)
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
  const center = useCenterSlug()
  const tracked = useTrackedStations(center)
  const entries = toStationEntries(stationsValue)
  const readings = useReportedReadings(center, entries)
  const byKey = new Map(tracked.stations.map((s) => [stationKey(s), s]))
  const live = selectColumns(columnsFromReported(entries, readings.of), entries)
  const stored = toColumnOrder(value)
  return {
    readings,
    entries,
    live,
    columns: orderColumns(live, stored),
    isCustom: stored.length > 0,
    name: (ref: Ref) => byKey.get(stationKey(ref))?.name ?? ref.stid,
    silent: entries.filter((e) => readings.of(e).length === 0),
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
  const { readings, entries, live, columns, isCustom, name, silent } = useColumnOrder(
    value,
    stationsField.value,
  )
  const removeColumn = ({ station, variable }: StationColumnConfig) =>
    stationsField.setValue(
      entries.map((e) =>
        stationKey(e) === stationKey(station) ? withoutReading(e, readings.of(e), variable) : e,
      ),
    )

  const note = statusNote(readings, entries.length > 0, columns.length > 0)
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
