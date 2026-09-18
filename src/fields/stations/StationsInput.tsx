'use client'

import type { StationRef } from '@/services/snowobs/snowobs'
import type { TrackedStation } from '@/services/snowobs/stationTracking'
import { FieldDescription, FieldError, FieldLabel, Select, useField } from '@payloadcms/ui'
import type { JSONFieldClientProps, StaticDescription } from 'payload'
import { toStationRefs } from './index'
import type { TrackedStations } from './useTrackedStations'
import { describeStation, useCenterSlug, useTrackedStations } from './useTrackedStations'

type Option = { label: string; value: string; stid: string; source: string; tracked: boolean }

function key(ref: StationRef): string {
  return `${ref.source}:${ref.stid}`
}

function trackedOption(station: TrackedStation): Option {
  return {
    label: describeStation(station),
    value: key(station),
    stid: station.stid,
    source: station.source,
    tracked: true,
  }
}

// A stored station SnowObs no longer lists still shows, marked, so it can be
// seen and removed rather than silently dropped.
function storedOption(ref: StationRef, options: Option[], ready: boolean): Option {
  return (
    options.find((o) => o.value === key(ref)) ?? {
      label: `${ref.stid} (${ref.source})${ready ? ' — not tracked in SnowObs' : ''}`,
      value: key(ref),
      stid: ref.stid,
      source: ref.source,
      tracked: false,
    }
  )
}

// react-select hands back option objects; resolve them by key rather than
// trust their shape.
function pickedRefs(picked: unknown, byKey: Map<string, Option>): StationRef[] {
  if (!Array.isArray(picked)) return []
  return picked.flatMap((p: { value?: unknown }) => {
    const option = byKey.get(String(p?.value))
    return option ? [{ stid: option.stid, source: option.source }] : []
  })
}

function Notes({
  path,
  tracked,
  description,
}: {
  path: string
  tracked: TrackedStations
  description?: StaticDescription
}) {
  if (tracked.status === 'error') {
    return (
      <FieldDescription
        path={path}
        description={`Could not load the SnowObs list (${tracked.message}). The stored stations are shown as ids.`}
      />
    )
  }
  return description != null ? <FieldDescription path={path} description={description} /> : null
}

// One searchable multi-select over the center's SnowObs tracking list. The
// chips are the page's stations in order; drag to reorder, backspace to drop.
export function StationsInput({ path, field }: JSONFieldClientProps) {
  const { value, setValue, showError, errorMessage } = useField<unknown>({ path })
  const tracked = useTrackedStations(useCenterSlug())
  const refs = toStationRefs(value)

  const options = tracked.stations.map(trackedOption)
  const selected = refs.map((ref) => storedOption(ref, options, tracked.status === 'ready'))
  const byKey = new Map([...options, ...selected].map((o) => [o.value, o]))

  const onChange = (picked: unknown) => setValue(pickedRefs(picked, byKey))

  return (
    <div className="field-type json stations-input mb-6">
      <FieldLabel htmlFor={path} label={field.label} required={field.required} />
      <Select
        inputId={path}
        isMulti
        isSortable
        isSearchable
        isClearable={false}
        isLoading={tracked.status === 'loading'}
        disabled={tracked.status === 'error'}
        placeholder="Search by name, id or source…"
        options={options}
        value={selected}
        onChange={onChange}
      />
      <Notes path={path} tracked={tracked} description={field.admin?.description} />
      <FieldError path={path} message={errorMessage} showError={showError} />
    </div>
  )
}
