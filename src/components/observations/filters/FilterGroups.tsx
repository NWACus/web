'use client'

/**
 * The filter sheet's groups, in the widget's order: observer for both tabs; then avalanches
 * observed and cracking/collapsing on the observations tab, or trigger, size, elevation, aspect,
 * impacts and problem on the avalanches tab.
 */
import { useEffect, useRef, useState } from 'react'

import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import {
  SIZE_RANGE,
  hasElevationError,
  type ObservationFilters,
} from '@/services/nac/observations/filters'
import {
  ASPECTS,
  AVALANCHE_PROBLEMS,
  CAUSES,
  IMPACTS,
  OBSERVER_TYPES,
  TRIGGER_GROUPS,
} from '@/services/nac/observations/options'

import { CheckList, CheckOption, toOptions } from './controls'

export interface GroupProps {
  filters: ObservationFilters
  onChange: (patch: Partial<ObservationFilters>) => void
}

export function ObserverGroup({ filters, onChange }: GroupProps) {
  return (
    <CheckList
      legend="Observer"
      allLabel="All Observers"
      options={OBSERVER_TYPES}
      selected={filters.observers}
      onChange={(observers) => onChange({ observers })}
    />
  )
}

export function ObservationGroups({ filters, onChange }: GroupProps) {
  return (
    <fieldset>
      <legend className="mb-1 text-sm font-semibold">Signs of Instability</legend>
      <CheckOption
        label="Avalanches Observed"
        checked={filters.avalanchesObserved}
        onChange={() => onChange({ avalanchesObserved: !filters.avalanchesObserved })}
      />
      <CheckOption
        label="Collapsing/Cracking"
        checked={filters.instability}
        onChange={() => onChange({ instability: !filters.instability })}
      />
    </fieldset>
  )
}

function TriggerGroup({ filters, onChange }: GroupProps) {
  return (
    <div className="flex flex-col gap-2">
      <CheckList
        legend="Trigger"
        allLabel="All Triggers"
        options={toOptions(TRIGGER_GROUPS.map((group) => group.label))}
        selected={filters.triggers}
        onChange={(triggers) => onChange({ triggers })}
        columns={2}
      />
      <CheckList
        legend="Secondary"
        options={toOptions(CAUSES.map((cause) => cause.label))}
        selected={filters.causes}
        onChange={(causes) => onChange({ causes })}
        columns={2}
      />
    </div>
  )
}

/** D1 to D5 in half steps; the list is sent bounds only once narrowed. */
function SizeGroup({ filters, onChange }: GroupProps) {
  const [size, setSize] = useState(filters.size)
  useEffect(() => setSize(filters.size), [filters.size])
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-semibold">Size</legend>
      <div className="text-sm" aria-live="polite">
        D{size[0]} - D{size[1]}
      </div>
      <Slider
        min={SIZE_RANGE[0]}
        max={SIZE_RANGE[1]}
        step={0.5}
        value={size}
        thumbLabels={['Smallest size', 'Largest size']}
        onValueChange={([min, max]) => setSize([min, max])}
        onValueCommit={([min, max]) => onChange({ size: [min, max] })}
      />
    </fieldset>
  )
}

/** Feet, applied half a second after typing stops, as the widget debounces it. */
const ELEVATION_DEBOUNCE_MS = 500

/** Feet typed into an elevation box: a number, null for empty, undefined for not a number yet. */
export function parseElevation(text: string): number | null | undefined {
  if (text.trim() === '') return null
  const value = Number(text)
  return Number.isFinite(value) ? value : undefined
}

function ElevationInput({
  label,
  value,
  onCommit,
}: {
  label: string
  value: number | null
  onCommit: (value: number | null) => void
}) {
  const [text, setText] = useState(value === null ? '' : String(value))
  useEffect(() => setText(value === null ? '' : String(value)), [value])
  // The latest callback, so a parent re-render doesn't restart the debounce.
  const commitRef = useRef(onCommit)
  commitRef.current = onCommit
  useEffect(() => {
    const parsed = parseElevation(text)
    if (parsed === undefined || parsed === value) return
    const timer = window.setTimeout(() => commitRef.current(parsed), ELEVATION_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [text, value])
  return (
    <label className="flex items-center gap-1 text-sm">
      <span className="sr-only">{label}</span>
      <Input
        type="number"
        inputMode="numeric"
        placeholder={label}
        className="h-9"
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
      <span aria-hidden="true">ft</span>
    </label>
  )
}

function ElevationGroup({ filters, onChange }: GroupProps) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-semibold">Elevation</legend>
      <div className="flex items-center gap-2">
        <ElevationInput
          label="Min Elevation"
          value={filters.elevationMin}
          onCommit={(elevationMin) => onChange({ elevationMin })}
        />
        <span className="text-sm">to</span>
        <ElevationInput
          label="Max Elevation"
          value={filters.elevationMax}
          onCommit={(elevationMax) => onChange({ elevationMax })}
        />
      </div>
      {hasElevationError(filters) && (
        <p role="alert" className="text-sm text-destructive">
          The minimum elevation cannot be greater than the maximum elevation
        </p>
      )}
    </fieldset>
  )
}

function ImpactsGroup({ filters, onChange }: GroupProps) {
  const groups = ['Humans', 'Vehicles', 'Structures'] as const
  const toggle = (value: (typeof IMPACTS)[number]['value']) =>
    onChange({
      impacts: filters.impacts.includes(value)
        ? filters.impacts.filter((impact) => impact !== value)
        : [...filters.impacts, value],
    })
  return (
    <fieldset>
      <legend className="mb-1 text-sm font-semibold">Impacts</legend>
      <div className="grid grid-cols-3 gap-2">
        {groups.map((group) => (
          <div key={group}>
            <div className="text-xs font-semibold uppercase text-muted-foreground">{group}</div>
            {IMPACTS.filter((impact) => impact.group === group).map((impact) => (
              <CheckOption
                key={impact.value}
                label={impact.label}
                checked={filters.impacts.includes(impact.value)}
                onChange={() => toggle(impact.value)}
              />
            ))}
          </div>
        ))}
      </div>
    </fieldset>
  )
}

export function AvalancheGroups(props: GroupProps) {
  const { filters, onChange } = props
  return (
    <>
      <TriggerGroup {...props} />
      <SizeGroup {...props} />
      <ElevationGroup {...props} />
      <CheckList
        legend="Aspect"
        allLabel="All Aspects"
        options={toOptions(ASPECTS)}
        selected={filters.aspects}
        onChange={(aspects) => onChange({ aspects })}
        columns={2}
      />
      <ImpactsGroup {...props} />
      <CheckList
        legend="Problem"
        allLabel="All Avalanche Problems"
        options={toOptions(AVALANCHE_PROBLEMS)}
        selected={filters.problems}
        onChange={(problems) => onChange({ problems })}
      />
    </>
  )
}
