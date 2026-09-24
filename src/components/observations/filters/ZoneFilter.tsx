'use client'

/**
 * The widget's zone dropdown: everything in the map area, only this center's records, or chosen
 * zones — the center's forecast zones, then "Other Regions" (its observation-only zones). Choosing
 * a zone clears "Only {center}" and the other way round, as in the widget; the map frames the
 * chosen zones, which is what narrows the list to them.
 */
import type { ObservationKind, ObservationZoneOption } from '@/services/nac/model/observation'
import type { ObservationFilters } from '@/services/nac/observations/filters'

import { CheckOption, FilterDropdown } from './controls'

interface ZoneFilterProps {
  kind: ObservationKind
  filters: ObservationFilters
  zones: ObservationZoneOption[]
  centerLabel: string
  onChange: (patch: Pick<ObservationFilters, 'zones' | 'onlyCenter'>) => void
}

function ZoneGroup({
  heading,
  zones,
  selected,
  onToggle,
}: {
  heading: string
  zones: ObservationZoneOption[]
  selected: string[]
  onToggle: (id: string) => void
}) {
  if (zones.length === 0) return null
  return (
    <fieldset className="mt-2">
      <legend className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
        {heading}
      </legend>
      {zones.map((zone) => (
        <CheckOption
          key={zone.id}
          label={zone.name}
          checked={selected.includes(zone.id)}
          onChange={() => onToggle(zone.id)}
        />
      ))}
    </fieldset>
  )
}

export function ZoneFilterOptions({
  kind,
  filters,
  zones,
  centerLabel,
  onChange,
}: ZoneFilterProps) {
  const records = kind === 'observation' ? 'observations' : 'avalanches'
  const toggle = (id: string) => {
    const next = filters.zones.includes(id)
      ? filters.zones.filter((zone) => zone !== id)
      : [...filters.zones, id]
    onChange({ zones: next, onlyCenter: false })
  }
  return (
    <div>
      <CheckOption
        label={`All ${records} in map area`}
        checked={filters.zones.length === 0 && !filters.onlyCenter}
        onChange={() => onChange({ zones: [], onlyCenter: false })}
      />
      <CheckOption
        label={`Only ${centerLabel} ${records}`}
        checked={filters.onlyCenter}
        onChange={() => onChange({ zones: [], onlyCenter: !filters.onlyCenter })}
      />
      <ZoneGroup
        heading={`${centerLabel} Forecast Zones`}
        zones={zones.filter((zone) => zone.type === 'forecast')}
        selected={filters.zones}
        onToggle={toggle}
      />
      <ZoneGroup
        heading="Other Regions"
        zones={zones.filter((zone) => zone.type === 'observation')}
        selected={filters.zones}
        onToggle={toggle}
      />
    </div>
  )
}

export function ZoneFilter(props: ZoneFilterProps) {
  return (
    <FilterDropdown label="Zone">
      <ZoneFilterOptions {...props} />
    </FilterDropdown>
  )
}
