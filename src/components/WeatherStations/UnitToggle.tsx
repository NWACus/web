'use client'

import type { UnitSystem } from '@/services/snowobs/metricUnits'
import { readLocalStorage, writeLocalStorage } from '@/utilities/safeLocalStorage'
import { cn } from '@/utilities/ui'
import { useEffect, useState } from 'react'

const STORAGE_KEY = 'nwac-station-graph-units'

// Unit choice persisted per browser; localStorage is browser-only, so the
// stored choice loads after mount.
export function useUnitSystem(): [UnitSystem, (system: UnitSystem) => void] {
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('imperial')
  useEffect(() => {
    setUnitSystem(readLocalStorage(STORAGE_KEY) === 'metric' ? 'metric' : 'imperial')
  }, [])
  const changeUnitSystem = (system: UnitSystem) => {
    setUnitSystem(system)
    writeLocalStorage(STORAGE_KEY, system)
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
  const chip = (system: UnitSystem, text: string) => (
    <button
      type="button"
      onClick={() => onChange(system)}
      aria-pressed={unit === system}
      className={cn(
        'relative z-10 w-20 rounded-md py-1.5 text-center text-sm transition-colors',
        unit === system ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {text}
    </button>
  )
  return (
    <div role="group" aria-label="Units" className="relative inline-flex rounded-md bg-muted p-1">
      {/* The active-chip background, sliding between the fixed-width chips. */}
      <span
        aria-hidden
        className={cn(
          'absolute inset-y-1 left-1 w-20 rounded-md bg-primary transition-transform duration-200',
          unit === 'metric' && 'translate-x-20',
        )}
      />
      {chip('imperial', 'Imperial')}
      {chip('metric', 'Metric')}
    </div>
  )
}
