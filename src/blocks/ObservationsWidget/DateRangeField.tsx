'use client'

import { useTenantSelection } from '@/providers/TenantSelectionProvider/index.client'
import { SelectInput, useField } from '@payloadcms/ui'
import type { TextFieldClientProps } from 'payload'
import { getFirstObservationSeason } from './getFirstObservationSeason'
import { type CenterLookup, useCenterLookup } from './useCenterLookup'
import { dateRangeOptions } from './widgetPath'

const DESCRIPTION_BY_STATUS: Record<CenterLookup<unknown>['status'], string | undefined> = {
  idle: undefined,
  loading: 'Loading past seasons…',
  ready: undefined,
  error: 'Could not load past seasons from avalanche.org. A saved season is kept.',
}

// The widget's date presets plus the center's past seasons
export function DateRangeField({ path, field }: TextFieldClientProps) {
  const { value, setValue, showError } = useField<string>({ path })
  const { selectedTenantSlug } = useTenantSelection()
  const firstSeason = useCenterLookup(selectedTenantSlug, getFirstObservationSeason)
  const firstSeasonEndYear = firstSeason.status === 'ready' ? firstSeason.value : null
  const selected = value ?? ''

  return (
    <SelectInput
      name={field.name}
      path={path}
      label={field.label}
      required={field.required}
      description={DESCRIPTION_BY_STATUS[firstSeason.status] ?? field.admin?.description}
      isClearable={false}
      options={dateRangeOptions(new Date(), firstSeasonEndYear, selected)}
      value={selected}
      showError={showError}
      onChange={(picked) =>
        setValue(picked && !Array.isArray(picked) ? String(picked.value) : selected)
      }
    />
  )
}
