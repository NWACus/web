'use client'

import type { TrackedStation } from '@/services/snowobs/stationTracking'
import {
  FieldDescription,
  FieldError,
  FieldLabel,
  Select,
  TextInput,
  useField,
} from '@payloadcms/ui'
import type { TextFieldClientProps } from 'payload'
import type { ChangeEvent } from 'react'
import type { TrackedStations } from './useTrackedStations'
import { describeStation, useCenterSlug, useTrackedStations } from './useTrackedStations'

type Option = { label: string; value: string; stid: string; source: string }

function optionKey(source: string | undefined, stid: string): string {
  return `${source ?? '?'}:${stid}`
}

function toOption(station: TrackedStation): Option {
  return {
    label: describeStation(station),
    value: optionKey(station.source, station.stid),
    stid: station.stid,
    source: station.source,
  }
}

// The stored pair as an option, whether or not SnowObs still lists it, so the
// select always shows what the page has.
function currentOption(options: Option[], stid: string, source: string | undefined): Option {
  const key = optionKey(source, stid)
  return (
    options.find((o) => o.value === key) ?? {
      label: `${stid} (${source ?? '?'})`,
      value: key,
      stid,
      source: source ?? '',
    }
  )
}

// What the select shows: the stored pair, and whether SnowObs still lists it.
function selection(
  options: Option[],
  stid: string | undefined,
  source: string | undefined,
): { current?: Option; listed: boolean } {
  if (!stid) return { listed: true }
  const current = currentOption(options, stid, source)
  return { current, listed: options.some((o) => o.value === current.value) }
}

function PickerNote({
  path,
  tracked,
  listed,
}: {
  path: string
  tracked: TrackedStations
  listed: boolean
}) {
  if (tracked.status === 'error') {
    return (
      <FieldDescription
        path={path}
        description={`Could not load the SnowObs list (${tracked.message}). The stored id is shown as is.`}
      />
    )
  }
  if (tracked.status === 'ready' && !listed) {
    return (
      <FieldDescription
        path={path}
        description="Not in this center's SnowObs tracking list any more. The page still fetches it; expect no data."
      />
    )
  }
  return null
}

// Replaces the plain `stid` input with a searchable list of the stations the
// center tracks in SnowObs, and writes the sibling `source` with it. The
// stored value is only ever the pair; everything shown is live.
export function StationPicker({ path, field }: TextFieldClientProps) {
  // `…stations.0.stid` -> `…stations.0.source`; the picker owns both.
  const sourcePath = path.replace(/stid$/, 'source')
  const stid = useField<string>({ path })
  const source = useField<string>({ path: sourcePath })
  const tracked = useTrackedStations(useCenterSlug())

  const options = tracked.stations.map(toOption)
  const { current, listed } = selection(options, stid.value, source.value)

  // react-select hands back the option object; look it up by key rather than
  // trust its shape.
  const pick = (picked: { value: unknown } | { value: unknown }[]) => {
    const chosen = Array.isArray(picked) ? picked[0] : picked
    const option = options.find((o) => o.value === chosen?.value)
    if (!option) return
    stid.setValue(option.stid)
    source.setValue(option.source)
  }

  return (
    <div className="field-type text station-picker mb-6">
      <FieldLabel htmlFor={path} label={field.label} required={field.required} />
      {tracked.status === 'error' ? (
        <TextInput
          path={path}
          value={stid.value ?? ''}
          onChange={(e: ChangeEvent<HTMLInputElement>) => stid.setValue(e.target.value)}
        />
      ) : (
        <Select
          inputId={path}
          isLoading={tracked.status === 'loading'}
          isClearable={false}
          isSearchable
          placeholder="Search by name, id or source…"
          options={options}
          value={current}
          onChange={pick}
        />
      )}
      <PickerNote path={path} tracked={tracked} listed={listed} />
      <FieldError path={path} />
    </div>
  )
}
