'use client'

/**
 * The 12 / 24 hour switch on the precipitation and snow table: both tables are rendered, and the
 * switch shows one. The toggle sits in each table's title row, so it stays put when they swap.
 */
import { createContext, useContext, useState, type ReactNode } from 'react'

import { cn } from '@/utilities/ui'

type Hours = '12' | '24'

const HoursContext = createContext<{ hours: Hours; setHours: (h: Hours) => void }>({
  hours: '12',
  setHours: () => {},
})

const OPTIONS: { hours: Hours; label: string }[] = [
  { hours: '12', label: '12 hours' },
  { hours: '24', label: '24 hours' },
]

export function PrecipHoursSwitch({ id, children }: { id: string; children: ReactNode }) {
  const [hours, setHours] = useState<Hours>('12')
  return (
    <HoursContext.Provider value={{ hours, setHours }}>
      <div id={id} className="scroll-mt-24">
        {children}
      </div>
    </HoursContext.Provider>
  )
}

export function PrecipHoursPanel({ hours, children }: { hours: Hours; children: ReactNode }) {
  const active = useContext(HoursContext).hours
  return <div hidden={hours !== active}>{children}</div>
}

export function PrecipHoursToggle() {
  const { hours, setHours } = useContext(HoursContext)
  return (
    <div
      role="group"
      aria-label="Period length"
      className="inline-flex overflow-hidden rounded-md border text-sm font-semibold print:hidden"
    >
      {OPTIONS.map((o, i) => (
        <button
          key={o.hours}
          type="button"
          aria-pressed={hours === o.hours}
          onClick={() => setHours(o.hours)}
          className={cn(
            'min-h-9 px-3',
            i > 0 && 'border-l',
            hours === o.hours
              ? 'bg-primary text-primary-foreground'
              : 'bg-background hover:bg-muted',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
