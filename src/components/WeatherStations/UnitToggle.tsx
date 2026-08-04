'use client'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useEffect, useState } from 'react'

export type UnitSystem = 'imperial' | 'metric'

const STORAGE_KEY = 'nwac-station-graph-units'

function loadUnitSystem(): UnitSystem {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'metric' ? 'metric' : 'imperial'
  } catch {
    return 'imperial'
  }
}

// Unit choice persisted per browser; localStorage is browser-only, so the
// stored choice loads after mount.
export function useUnitSystem(): [UnitSystem, (system: UnitSystem) => void] {
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('imperial')
  useEffect(() => setUnitSystem(loadUnitSystem()), [])
  const changeUnitSystem = (system: UnitSystem) => {
    setUnitSystem(system)
    try {
      window.localStorage.setItem(STORAGE_KEY, system)
    } catch {
      // Private mode / quota errors just lose persistence, never the feature.
    }
  }
  return [unitSystem, changeUnitSystem]
}

export function UnitToggle({
  unit,
  onChange,
}: {
  unit: UnitSystem
  onChange: (unit: UnitSystem) => void
}) {
  return (
    <ToggleGroup
      type="single"
      size="sm"
      variant="outline"
      value={unit}
      onValueChange={(v) => (v === 'imperial' || v === 'metric') && onChange(v)}
      aria-label="Units"
    >
      <ToggleGroupItem
        value="imperial"
        className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
      >
        Imperial
      </ToggleGroupItem>
      <ToggleGroupItem
        value="metric"
        className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
      >
        Metric
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
