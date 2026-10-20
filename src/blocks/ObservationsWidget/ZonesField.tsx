'use client'

import { useTenantSelection } from '@/providers/TenantSelectionProvider/index.client'
import { SelectInput, useField } from '@payloadcms/ui'
import type { TextFieldClientProps } from 'payload'
import { getActiveZoneNames } from './getActiveZoneNames'
import { type CenterLookup, useCenterLookup } from './useCenterLookup'

type ZoneNames = CenterLookup<string[]>

const DESCRIPTION_BY_STATUS: Record<ZoneNames['status'], string | undefined> = {
  idle: undefined,
  loading: 'Loading zones…',
  ready: undefined,
  error: 'Could not load zones from avalanche.org. Saved zones are kept.',
}

// Saved zones the center no longer lists stay visible, flagged, so they can be removed. The
// widget drops a zone it can't find, or shows nothing if it finds none of them.
function zoneOptions(zones: ZoneNames, selected: string[]) {
  const active = zones.status === 'ready' ? zones.value : []
  const flagRetired = active.length > 0
  return [...new Set([...active, ...selected])].map((name) => ({
    label: flagRetired && !active.includes(name) ? `${name} (no longer active)` : name,
    value: name,
  }))
}

// A multi-select over the center's active zones, stored as zone names.
export function ZonesField({ path, field }: TextFieldClientProps) {
  const { value, setValue, showError } = useField<string[]>({ path })
  const { selectedTenantSlug } = useTenantSelection()
  const zones = useCenterLookup(selectedTenantSlug, getActiveZoneNames)
  const selected = Array.isArray(value) ? value : []

  return (
    <SelectInput
      name={field.name}
      path={path}
      label={field.label}
      description={DESCRIPTION_BY_STATUS[zones.status] ?? field.admin?.description}
      hasMany
      isClearable
      options={zoneOptions(zones, selected)}
      value={selected}
      showError={showError}
      onChange={(picked) =>
        setValue(Array.isArray(picked) ? picked.map((option) => String(option.value)) : [])
      }
    />
  )
}
