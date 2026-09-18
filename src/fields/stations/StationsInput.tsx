'use client'

import type { StationRef } from '@/services/snowobs/snowobs'
import type { TrackedStation } from '@/services/snowobs/stationTracking'
import {
  Button,
  DraggableSortable,
  DraggableSortableItem,
  DragHandleIcon,
  FieldDescription,
  FieldError,
  FieldLabel,
  Select,
  useField,
} from '@payloadcms/ui'
import type { JSONFieldClientProps, StaticDescription } from 'payload'
import { useState } from 'react'
import { toStationRefs } from './index'
import type { TrackedStations } from './useTrackedStations'
import { useCenterSlug, useTrackedStations } from './useTrackedStations'

type Option = { label: string; value: string; stid: string; source: string }

function key(ref: StationRef): string {
  return `${ref.source}:${ref.stid}`
}

function optionFor(station: TrackedStation): Option {
  const elevation = station.elevation != null ? ` · ${Math.round(station.elevation)} ft` : ''
  return {
    label: `${station.name ?? station.stid}${elevation} · ${station.source}`,
    value: key(station),
    stid: station.stid,
    source: station.source,
  }
}

function moved<T>(list: T[], from: number, to: number): T[] {
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

// What a row shows: the live station, or the bare id with a note when
// SnowObs no longer lists it.
type RowView = { name: string; elevation: string; partner: string; untracked: boolean }

function trackedView(station: TrackedStation): RowView {
  return {
    name: station.name ?? station.stid,
    elevation: station.elevation != null ? `${Math.round(station.elevation)} ft` : '',
    partner: station.partner ?? '',
    untracked: false,
  }
}

function rowView(entry: StationRef, tracked: TrackedStations): RowView {
  const station = tracked.stations.find((s) => s.stid === entry.stid && s.source === entry.source)
  if (station) return trackedView(station)
  return { name: entry.stid, elevation: '', partner: '', untracked: tracked.status === 'ready' }
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
          <td className="stations-table__handle" {...attributes} {...listeners}>
            <DragHandleIcon />
          </td>
          <td className="stations-table__order">{index + 1}</td>
          <td className={view.untracked ? 'stations-table__untracked' : undefined}>
            {view.name}
            {view.untracked && (
              <span className="stations-table__note"> — not tracked in SnowObs</span>
            )}
          </td>
          <td className="stations-table__id">{entry.stid}</td>
          <td>{entry.source}</td>
          <td>{view.elevation}</td>
          <td>{view.partner}</td>
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

const TABLE_HEAD = (
  <thead>
    <tr>
      <th />
      <th />
      <th>Name</th>
      <th>ID</th>
      <th>Source</th>
      <th>Elevation</th>
      <th>Partner</th>
      <th />
    </tr>
  </thead>
)

function StationsTable({
  refs,
  tracked,
  onChange,
}: {
  refs: StationRef[]
  tracked: TrackedStations
  onChange: (refs: StationRef[]) => void
}) {
  const rows = refs.map((entry, index) => (
    <StationRow
      key={key(entry)}
      entry={entry}
      index={index}
      view={rowView(entry, tracked)}
      onRemove={() => onChange(refs.filter((_, i) => i !== index))}
    />
  ))
  const onDragEnd = ({
    moveFromIndex,
    moveToIndex,
  }: {
    moveFromIndex: number
    moveToIndex: number
  }) => onChange(moved(refs, moveFromIndex, moveToIndex))
  return (
    <DraggableSortable ids={refs.map(key)} onDragEnd={onDragEnd}>
      <table className="stations-table">
        {TABLE_HEAD}
        <tbody>{rows}</tbody>
      </table>
    </DraggableSortable>
  )
}

// A searchable select over the stations not yet listed, and an Add button
// that appends the chosen one.
function AddStation({
  path,
  options,
  onAdd,
}: {
  path: string
  options: Option[]
  onAdd: (ref: StationRef) => void
}) {
  const [chosen, setChosen] = useState<Option | null>(null)
  const add = () => {
    if (!chosen) return
    onAdd({ stid: chosen.stid, source: chosen.source })
    setChosen(null)
  }
  return (
    <div className="stations-table__add">
      <Select
        inputId={`${path}-add`}
        isSearchable
        isClearable
        placeholder="Search by name, id or source…"
        options={options}
        value={chosen ?? undefined}
        onChange={(picked) =>
          setChosen(
            options.find((o) => !Array.isArray(picked) && o.value === picked?.value) ?? null,
          )
        }
      />
      <Button buttonStyle="secondary" size="small" disabled={!chosen} onClick={add}>
        Add
      </Button>
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
  onAdd: (ref: StationRef) => void
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
      {description != null && <FieldDescription path={path} description={description} />}
    </>
  )
}

// The page's stations as a table, in table order: drag to reorder, remove
// with the X, add from the center's SnowObs tracking list.
export function StationsInput({ path, field }: JSONFieldClientProps) {
  const { value, setValue, showError, errorMessage } = useField<unknown>({ path })
  const tracked = useTrackedStations(useCenterSlug())
  const refs = toStationRefs(value)
  const onPage = new Set(refs.map(key))
  const options = tracked.stations.map(optionFor).filter((o) => !onPage.has(o.value))

  return (
    <div className="field-type json stations-input mb-6">
      <FieldLabel htmlFor={path} label={field.label} required={field.required} />
      {refs.length > 0 && <StationsTable refs={refs} tracked={tracked} onChange={setValue} />}
      <Footer
        path={path}
        tracked={tracked}
        options={options}
        description={field.admin?.description}
        onAdd={(ref) => setValue([...refs, ref])}
      />
      <FieldError path={path} message={errorMessage} showError={showError} />
    </div>
  )
}
