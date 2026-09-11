'use client'

/**
 * The station map's option groups, shared by the desktop dropdowns and the mobile sheet. Each is
 * a fieldset of native radios or checkboxes, labelled as the widget labels them.
 */
import { useId } from 'react'

import {
  SHOW_ALL_VARIABLE,
  TYPE_OPTIONS,
  UNIT_OPTIONS,
  WITHIN_OPTIONS,
  type StationMapFilters as Filters,
} from '@/services/snowobs/stationMap/filters'
import { orderVariables } from '@/services/snowobs/stationMap/format'
import type { StationMapVariable } from '@/services/snowobs/stationMap/model'

export interface OptionGroupProps {
  filters: Filters
  onChange: (patch: Partial<Filters>) => void
}

function RadioOptions<T extends string | number | null>({
  name,
  options,
  value,
  onSelect,
}: {
  name: string
  options: { value: T; label: string }[]
  value: T
  onSelect: (value: T) => void
}) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1">
      {options.map((option) => {
        const optionId = `${id}-${String(option.value)}`
        return (
          <label
            key={String(option.value)}
            htmlFor={optionId}
            className="flex items-center gap-2 text-sm"
          >
            <input
              id={optionId}
              type="radio"
              name={`${id}-${name}`}
              className="accent-primary"
              checked={value === option.value}
              onChange={() => onSelect(option.value)}
            />
            {option.label}
          </label>
        )
      })}
    </div>
  )
}

export function UnitOptions({ filters, onChange }: OptionGroupProps) {
  return (
    <fieldset>
      <legend className="mb-1 text-sm font-semibold">Units</legend>
      <RadioOptions
        name="units"
        options={UNIT_OPTIONS}
        value={filters.units}
        onSelect={(units) => onChange({ units })}
      />
    </fieldset>
  )
}

export function VariableOptions({
  filters,
  onChange,
  variables,
}: OptionGroupProps & { variables: StationMapVariable[] }) {
  const names = new Map(variables.map((v) => [v.variable, v.longName]))
  const options = [
    { value: SHOW_ALL_VARIABLE, label: 'Show All' },
    ...orderVariables(variables.map((v) => v.variable)).map((variable) => ({
      value: variable,
      label: names.get(variable) ?? variable,
    })),
  ]
  return (
    <fieldset>
      <legend className="mb-1 text-sm font-semibold">Station Labels</legend>
      <RadioOptions
        name="variable"
        options={options}
        value={filters.variable}
        onSelect={(variable) => onChange({ variable })}
      />
    </fieldset>
  )
}

export function RecencyOptions({ filters, onChange }: OptionGroupProps) {
  return (
    <fieldset>
      <legend className="mb-1 text-sm font-semibold">Last Updated</legend>
      <p className="mb-1 text-xs text-muted-foreground">Only show data updated within the last:</p>
      <RadioOptions
        name="within"
        options={WITHIN_OPTIONS}
        value={filters.withinMinutes}
        onSelect={(withinMinutes) => onChange({ withinMinutes })}
      />
    </fieldset>
  )
}

export function ZoneOptions({
  filters,
  onChange,
  zoneNames,
}: OptionGroupProps & { zoneNames: string[] }) {
  const id = useId()
  const toggle = (zone: string, checked: boolean) =>
    onChange({
      zones: checked ? [...filters.zones, zone] : filters.zones.filter((z) => z !== zone),
    })

  return (
    <fieldset>
      <legend className="mb-1 text-sm font-semibold">Zone</legend>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${id}-all`} className="flex items-center gap-2 text-sm">
          <input
            id={`${id}-all`}
            type="checkbox"
            className="accent-primary"
            checked={filters.zones.length === 0}
            onChange={() => onChange({ zones: [] })}
          />
          All Zones
        </label>
        {zoneNames.map((zone, index) => (
          <label
            key={zone}
            htmlFor={`${id}-${index}`}
            className="flex items-center gap-2 whitespace-nowrap text-sm"
          >
            <input
              id={`${id}-${index}`}
              type="checkbox"
              className="accent-primary"
              checked={filters.zones.includes(zone)}
              onChange={(event) => toggle(zone, event.target.checked)}
            />
            {zone}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export function TypeOptions({ filters, onChange }: OptionGroupProps) {
  return (
    <fieldset>
      <legend className="mb-1 text-sm font-semibold">Type</legend>
      <RadioOptions
        name="type"
        options={TYPE_OPTIONS}
        value={filters.type}
        onSelect={(type) => onChange({ type })}
      />
    </fieldset>
  )
}
