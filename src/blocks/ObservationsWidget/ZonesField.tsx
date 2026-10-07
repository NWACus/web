'use client'

import { useTenantSelection } from '@/providers/TenantSelectionProvider/index.client'
import { SelectInput, useField } from '@payloadcms/ui'
import type { TextFieldClientProps } from 'payload'
import { useEffect, useState } from 'react'
import { getActiveZoneNames } from './getActiveZoneNames'

type ZoneNames =
  | { status: 'loading'; names: [] }
  | { status: 'ready'; names: string[] }
  | { status: 'error'; names: [] }

function useActiveZoneNames(center: string | undefined): ZoneNames {
  const [state, setState] = useState<ZoneNames>({ status: 'loading', names: [] })
  useEffect(() => {
    if (!center) {
      setState({ status: 'ready', names: [] })
      return
    }
    let cancelled = false
    setState({ status: 'loading', names: [] })
    getActiveZoneNames(center).then(
      (names) => {
        if (!cancelled) setState({ status: 'ready', names })
      },
      () => {
        if (!cancelled) setState({ status: 'error', names: [] })
      },
    )
    return () => {
      cancelled = true
    }
  }, [center])
  return state
}

const DESCRIPTION_BY_STATUS: Record<ZoneNames['status'], string | undefined> = {
  loading: 'Loading zones…',
  ready: undefined,
  error: 'Could not load zones from avalanche.org. Saved zones are kept.',
}

// Saved zones the center no longer lists stay visible, flagged, so they can be removed. The
// widget drops a zone it can't find, or shows nothing if it finds none of them.
function zoneOptions(zones: ZoneNames, selected: string[]) {
  const flagRetired = zones.status === 'ready' && zones.names.length > 0
  return [...new Set([...zones.names, ...selected])].map((name) => ({
    label: flagRetired && !zones.names.includes(name) ? `${name} (no longer active)` : name,
    value: name,
  }))
}

// A multi-select over the center's active zones, stored as zone names.
export function ZonesField({ path, field }: TextFieldClientProps) {
  const { value, setValue, showError } = useField<string[]>({ path })
  const { selectedTenantSlug } = useTenantSelection()
  const zones = useActiveZoneNames(selectedTenantSlug)
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
