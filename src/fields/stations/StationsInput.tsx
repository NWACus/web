'use client'

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
} from '@payloadcms/ui'
import type { JSONFieldClientProps, StaticDescription } from 'payload'
import { useState } from 'react'
import type { RequiredVariable, StationsInputClientProps } from './index'
import { toStationRefs } from './index'
import { HandleCells, reorder } from './sortable'
import type { StationStatus } from './status'
import { stationStatus, STATUS_LABEL } from './status'
import type { TrackedStations } from './useTrackedStations'
import { useCenterSlug, useTrackedStations } from './useTrackedStations'

type Option = { label: string; value: string; stid: string; source: string; status: StationStatus }

function key(ref: StationRef): string {
  return `${ref.source}:${ref.stid}`
}

// Whether a station reports the sensor the list needs: yes, no, or unknown
// when it has no current observation to judge by.
function reports(station: TrackedStation, required?: RequiredVariable): boolean | null {
  if (!required) return null
  if (station.variables.length === 0) return null
  return station.variables.includes(required.variable)
}

// SnowObs's status as a colored dot; the label is in the title.
function StatusDot({ status }: { status: StationStatus }) {
  return (
    <span
      className={`stations-status stations-status--${status}`}
      title={STATUS_LABEL[status]}
      aria-label={STATUS_LABEL[status]}
    />
  )
}

// react-select renders the menu entries through this: the dot, then the label.
function StatusOption(props: {
  innerRef: (el: HTMLDivElement | null) => void
  innerProps: Record<string, unknown>
  isFocused: boolean
  data: Option
}) {
  return (
    <div
      ref={props.innerRef}
      {...props.innerProps}
      className={`rs__option${props.isFocused ? ' rs__option--is-focused' : ''} stations-option`}
    >
      <StatusDot status={props.data.status} />
      {props.data.label}
    </div>
  )
}

// Picker entries read "Name · id · source"; the table has the rest.
function optionFor(station: TrackedStation): Option {
  return {
    label: `${station.name ?? station.stid} · ${station.stid} · ${station.source}`,
    status: stationStatus(station),
    value: key(station),
    stid: station.stid,
    source: station.source,
  }
}

// What a row shows: the live station, or the bare id with a note when
// SnowObs no longer lists it.
// `note` is the reason a row is flagged, or empty: SnowObs no longer lists
// the station, or its latest report lacks the sensor the list needs.
type RowView = {
  name: string
  elevation: string
  partner: string
  note: string
  status: StationStatus
}

function sensorNote(station: TrackedStation, required?: RequiredVariable): string {
  if (!required || reports(station, required) !== false) return ''
  return ` — no ${required.label.toLowerCase()} in its latest report`
}

function trackedView(station: TrackedStation, required?: RequiredVariable): RowView {
  return {
    name: station.name ?? station.stid,
    elevation: station.elevation != null ? `${Math.round(station.elevation)} ft` : '',
    partner: station.partner ?? '',
    note: sensorNote(station, required),
    status: stationStatus(station),
  }
}

function rowView(
  entry: StationRef,
  tracked: TrackedStations,
  required?: RequiredVariable,
): RowView {
  const station = tracked.stations.find((s) => s.stid === entry.stid && s.source === entry.source)
  if (station) return trackedView(station, required)
  const note = tracked.status === 'ready' ? ' — not tracked in SnowObs' : ''
  return { name: entry.stid, elevation: '', partner: '', note, status: 'untracked' }
}

function NameCell({ view }: { view: RowView }) {
  return (
    <td className={view.note ? 'stations-table__untracked' : undefined}>
      {view.name}
      {view.note && <span className="stations-table__note">{view.note}</span>}
    </td>
  )
}

function StationRow({
  entry,
  index,
  view,
  onRemove,
}: {
  entry: StationRef
  index: number
  view: RowView
  onRemove: () => void
}) {
  return (
    <DraggableSortableItem id={key(entry)}>
      {({ attributes, listeners, setNodeRef, transform, transition }) => (
        <tr ref={setNodeRef} style={{ transform, transition }}>
          <HandleCells index={index} handle={{ ...attributes, ...listeners }} />
          <NameCell view={view} />
          <td className="stations-table__id">{entry.stid}</td>
          <td>{entry.source}</td>
          <td>{view.elevation}</td>
          <td>{view.partner}</td>
          <td className="stations-table__status">
            <StatusDot status={view.status} /> {STATUS_LABEL[view.status]}
          </td>
          <td className="stations-table__remove">
            <Button
              buttonStyle="icon-label"
              icon="x"
              size="small"
              aria-label={`Remove ${view.name}`}
              onClick={onRemove}
            />
          </td>
        </tr>
      )}
    </DraggableSortableItem>
  )
}

function TableHead() {
  return (
    <thead>
      <tr>
        <th />
        <th />
        <th>Name</th>
        <th>ID</th>
        <th>Source</th>
        <th>Elevation</th>
        <th>Partner</th>
        <th>Status</th>
        <th />
      </tr>
    </thead>
  )
}

function StationsTable({
  refs,
  tracked,
  required,
  onChange,
}: {
  refs: StationRef[]
  tracked: TrackedStations
  required?: RequiredVariable
  onChange: (refs: StationRef[]) => void
}) {
  const rows = refs.map((entry, index) => (
    <StationRow
      key={key(entry)}
      entry={entry}
      index={index}
      view={rowView(entry, tracked, required)}
      onRemove={() => onChange(refs.filter((_, i) => i !== index))}
    />
  ))
  return (
    <DraggableSortable ids={refs.map(key)} onDragEnd={reorder(refs, onChange)}>
      <table className="stations-table">
        <TableHead />
        <tbody>{rows}</tbody>
      </table>
    </DraggableSortable>
  )
}

// A searchable select over the stations not yet listed; pick one or several,
// and Add appends them in the order picked.
function AddStation({
  path,
  options,
  onAdd,
}: {
  path: string
  options: Option[]
  onAdd: (refs: StationRef[]) => void
}) {
  const [chosen, setChosen] = useState<Option[]>([])
  const add = () => {
    if (chosen.length === 0) return
    onAdd(chosen.map((o) => ({ stid: o.stid, source: o.source })))
    setChosen([])
  }
  const pick = (picked: unknown) => {
    const values = new Set((Array.isArray(picked) ? picked : []).map((p) => String(p?.value)))
    setChosen(options.filter((o) => values.has(o.value)))
  }
  return (
    <div className="stations-table__add">
      <label className="field-label" htmlFor={`${path}-add`}>
        Add station
      </label>
      <div className="stations-table__add-row">
        <Select
          inputId={`${path}-add`}
          isMulti
          isSearchable
          isClearable
          placeholder="Search by name, id or source…"
          options={options}
          value={chosen}
          onChange={pick}
          components={{ Option: StatusOption }}
        />
        <Button buttonStyle="secondary" disabled={chosen.length === 0} onClick={add}>
          {chosen.length > 1 ? `Add ${chosen.length}` : 'Add'}
        </Button>
      </div>
    </div>
  )
}

// Below the table: the add control and the field's own description, or the
// reason neither is available.
function Footer({
  path,
  tracked,
  options,
  description,
  onAdd,
}: {
  path: string
  tracked: TrackedStations
  options: Option[]
  description?: StaticDescription
  onAdd: (refs: StationRef[]) => void
}) {
  if (tracked.status === 'error') {
    return (
      <FieldDescription
        path={path}
        description={`Could not load the SnowObs list (${tracked.message}). Stations show as ids and none can be added until it is back.`}
      />
    )
  }
  return (
    <>
      <AddStation path={path} options={options} onAdd={onAdd} />
      {description && <FieldDescription path={path} description={description} />}
    </>
  )
}

// The page's stations as a table, in table order: drag to reorder, remove
// with the X, add from the center's SnowObs tracking list.
export function StationsInput({
  path,
  field,
  requiredVariable,
}: JSONFieldClientProps & StationsInputClientProps) {
  const { value, setValue, showError, errorMessage } = useField<unknown>({ path })
  const tracked = useTrackedStations(useCenterSlug())
  const refs = toStationRefs(value)
  const onPage = new Set(refs.map(key))
  // Offer only stations that report what the list needs, and not ones already on it.
  const options = tracked.stations
    .filter((s) => !requiredVariable || reports(s, requiredVariable) === true)
    .map(optionFor)
    .filter((o) => !onPage.has(o.value))

  return (
    <div className="field-type json stations-input mb-6">
      <FieldLabel htmlFor={path} label={field.label} required={field.required} />
      {refs.length > 0 && (
        <StationsTable
          refs={refs}
          tracked={tracked}
          required={requiredVariable}
          onChange={setValue}
        />
      )}
      <Footer
        path={path}
        tracked={tracked}
        options={options}
        description={field.admin?.description}
        onAdd={(added) => setValue([...refs, ...added])}
      />
      <FieldError path={path} message={errorMessage} showError={showError} />
    </div>
  )
}
