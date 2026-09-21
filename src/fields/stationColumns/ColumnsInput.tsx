'use client'

import { toStationRefs } from '@/fields/stations'
import { HandleCells, reorder } from '@/fields/stations/sortable'
import { useCenterSlug, useTrackedStations } from '@/fields/stations/useTrackedStations'
import {
  HIDDEN_TABLE_VARIABLES,
  SENSOR_LABELS,
  TABLE_VARIABLE_ORDER,
} from '@/services/snowobs/constants'
import type { StationRef } from '@/services/snowobs/snowobs'
import type { TrackedStation } from '@/services/snowobs/stationTracking'
import {
  Button,
  DraggableSortable,
  DraggableSortableItem,
  FieldDescription,
  FieldError,
  FieldLabel,
  Select,
  useField,
  useFormFields,
} from '@payloadcms/ui'
import type { JSONFieldClientProps, StaticDescription } from 'payload'
import { useState } from 'react'
import type { ColumnsInputClientProps, StationColumn } from './index'
import { toStationColumns } from './index'

type Option = { label: string; value: string }

function key(column: StationColumn): string {
  return `${column.stid}:${column.variable}`
}

function variableLabel(variable: string): string {
  const short = SENSOR_LABELS[variable]
  return short ? `${short} (${variable})` : variable
}

function rank(variable: string): number {
  const index = TABLE_VARIABLE_ORDER.findIndex((known) => known === variable)
  return index === -1 ? TABLE_VARIABLE_ORDER.length : index
}

// The readings a station can head a column with: what its latest observation
// carried, or the known list when SnowObs has no observation to go by.
function variablesFor(station: TrackedStation | undefined): string[] {
  const reported = (station?.variables ?? []).filter(
    (v) => v !== 'date_time' && !HIDDEN_TABLE_VARIABLES.has(v),
  )
  const list = reported.length > 0 ? reported : [...TABLE_VARIABLE_ORDER]
  return [...list].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
}

function pickOne(picked: unknown): string | null {
  return typeof picked === 'object' && picked !== null && 'value' in picked
    ? String(picked.value)
    : null
}

function ColumnRow({
  column,
  index,
  stationName,
  onRemove,
}: {
  column: StationColumn
  index: number
  stationName: string
  onRemove: () => void
}) {
  const label = `${stationName} ${variableLabel(column.variable)}`
  return (
    <DraggableSortableItem id={key(column)}>
      {({ attributes, listeners, setNodeRef, transform, transition }) => (
        <tr ref={setNodeRef} style={{ transform, transition }}>
          <HandleCells index={index} handle={{ ...attributes, ...listeners }} />
          <td>{stationName}</td>
          <td className="stations-table__id">{column.stid}</td>
          <td>{variableLabel(column.variable)}</td>
          <td className="stations-table__remove">
            <Button
              buttonStyle="icon-label"
              icon="x"
              size="small"
              aria-label={`Remove ${label}`}
              onClick={onRemove}
            />
          </td>
        </tr>
      )}
    </DraggableSortableItem>
  )
}

function ColumnsHead() {
  return (
    <thead>
      <tr>
        <th />
        <th />
        <th>Station</th>
        <th>ID</th>
        <th>Reading</th>
        <th />
      </tr>
    </thead>
  )
}

function ColumnsTable({
  columns,
  nameOf,
  onChange,
}: {
  columns: StationColumn[]
  nameOf: (stid: string) => string
  onChange: (columns: StationColumn[]) => void
}) {
  const rows = columns.map((column, index) => (
    <ColumnRow
      key={key(column)}
      column={column}
      index={index}
      stationName={nameOf(column.stid)}
      onRemove={() => onChange(columns.filter((_, i) => i !== index))}
    />
  ))
  return (
    <DraggableSortable ids={columns.map(key)} onDragEnd={reorder(columns, onChange)}>
      <table className="stations-table">
        <ColumnsHead />
        <tbody>{rows}</tbody>
      </table>
    </DraggableSortable>
  )
}

// Live station names for the rows and the picker, from the tracking list;
// the bare id until it loads or when SnowObs no longer lists the station.
function useStationLookup(stations: StationRef[]) {
  const tracked = useTrackedStations(useCenterSlug())
  const trackedOf = (ref: StationRef) =>
    tracked.stations.find((s) => s.stid === ref.stid && s.source === ref.source)
  const nameOf = (stid: string) => {
    const ref = stations.find((s) => s.stid === stid)
    return (ref && trackedOf(ref)?.name) ?? stid
  }
  return { trackedOf, nameOf }
}

type Lookup = ReturnType<typeof useStationLookup>

// Pick one of the page's stations, then one of the readings it reports.
function AddColumn({
  path,
  stations,
  lookup,
  listed,
  onAdd,
}: {
  path: string
  stations: StationRef[]
  lookup: Lookup
  listed: Set<string>
  onAdd: (column: StationColumn) => void
}) {
  const [stid, setStid] = useState<string | null>(null)
  const [variable, setVariable] = useState<string | null>(null)
  const stationOptions: Option[] = stations.map((s) => ({
    value: s.stid,
    label: `${lookup.nameOf(s.stid)} · ${s.stid}`,
  }))
  const station = stations.find((s) => s.stid === stid)
  const variableOptions: Option[] = station
    ? variablesFor(lookup.trackedOf(station))
        .filter((v) => !listed.has(`${station.stid}:${v}`))
        .map((v) => ({ value: v, label: variableLabel(v) }))
    : []
  const add = () => {
    if (!stid || !variable) return
    onAdd({ stid, variable })
    setVariable(null)
  }
  return (
    <div className="stations-table__add">
      <label className="field-label" htmlFor={`${path}-add-station`}>
        Add column
      </label>
      <div className="stations-table__add-row">
        <Select
          inputId={`${path}-add-station`}
          isClearable
          placeholder="Station…"
          options={stationOptions}
          value={stationOptions.find((o) => o.value === stid)}
          onChange={(picked) => {
            setStid(pickOne(picked))
            setVariable(null)
          }}
        />
        <Select
          inputId={`${path}-add-variable`}
          isClearable
          isSearchable
          disabled={!station}
          placeholder="Reading…"
          options={variableOptions}
          value={variableOptions.find((o) => o.value === variable)}
          onChange={(picked) => setVariable(pickOne(picked))}
        />
        <Button buttonStyle="secondary" disabled={!stid || !variable} onClick={add}>
          Add
        </Button>
      </div>
    </div>
  )
}

// Below the table: the add control once the page has stations, and the
// field's own description.
function Footer({
  path,
  stations,
  columns,
  description,
  lookup,
  onAdd,
}: {
  path: string
  stations: StationRef[]
  columns: StationColumn[]
  description?: StaticDescription
  lookup: Lookup
  onAdd: (column: StationColumn) => void
}) {
  return (
    <>
      {stations.length > 0 ? (
        <AddColumn
          path={path}
          stations={stations}
          lookup={lookup}
          listed={new Set(columns.map(key))}
          onAdd={onAdd}
        />
      ) : (
        <FieldDescription path={path} description="Add stations to the page first." />
      )}
      {description && <FieldDescription path={path} description={description} />}
    </>
  )
}

// The page's table columns, in table order: drag to reorder, remove with the
// X, add a reading from one of the page's stations. Empty means derived.
export function ColumnsInput({
  path,
  field,
  stationsPath,
}: JSONFieldClientProps & ColumnsInputClientProps) {
  const { value, setValue, showError, errorMessage } = useField<unknown>({ path })
  const stationsValue = useFormFields(([fields]) => fields[stationsPath]?.value)
  const stations = toStationRefs(stationsValue)
  const columns = toStationColumns(value)
  const lookup = useStationLookup(stations)

  return (
    <div className="field-type json stations-input mb-6">
      <FieldLabel htmlFor={path} label={field.label} required={field.required} />
      {columns.length > 0 && (
        <ColumnsTable columns={columns} nameOf={lookup.nameOf} onChange={setValue} />
      )}
      <Footer
        path={path}
        stations={stations}
        columns={columns}
        description={field.admin?.description}
        lookup={lookup}
        onAdd={(column) => setValue([...columns, column])}
      />
      <FieldError path={path} message={errorMessage} showError={showError} />
    </div>
  )
}
