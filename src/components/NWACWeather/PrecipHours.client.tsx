'use client'

/**
 * The 12 / 24 hour switch on the precipitation and snow table: both tables are rendered, and the
 * switch shows one. It sits above the days on a phone, and at the right of the title from md up.
 */
import { createContext, useContext, useState, type ReactNode } from 'react'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/utilities/ui'

import { SharedDayProvider } from './DaySwitch.client'

type Hours = '12' | '24'

const HoursContext = createContext<{ hours: Hours; setHours: (h: Hours) => void }>({
  hours: '12',
  setHours: () => {},
})

const OPTIONS: { hours: Hours; label: string; name: string }[] = [
  { hours: '12', label: '12 hrs', name: '12 hours' },
  { hours: '24', label: '24 hrs', name: '24 hours' },
]

export function PrecipHoursSwitch({ id, children }: { id: string; children: ReactNode }) {
  const [hours, setHours] = useState<Hours>('12')
  return (
    <HoursContext.Provider value={{ hours, setHours }}>
      <SharedDayProvider>
        <div id={id} className="scroll-mt-24">
          {children}
        </div>
      </SharedDayProvider>
    </HoursContext.Provider>
  )
}

export function PrecipHoursPanel({ hours, children }: { hours: Hours; children: ReactNode }) {
  const active = useContext(HoursContext).hours
  return <div hidden={hours !== active}>{children}</div>
}

const isHours = (value: string): value is Hours => OPTIONS.some((o) => o.hours === value)

/** The picked option is in the primary blue. */
export function PrecipHoursToggle() {
  const { hours, setHours } = useContext(HoursContext)
  return (
    <ToggleGroup
      type="single"
      aria-label="Period length"
      value={hours}
      // Radix sends '' when the pressed item is pressed again; keep the switch on a value.
      onValueChange={(value) => isHours(value) && setHours(value)}
      className="flex gap-0 overflow-hidden md:inline-flex rounded-md border text-sm font-semibold"
    >
      {OPTIONS.map((o, i) => (
        <ToggleGroupItem
          key={o.hours}
          value={o.hours}
          aria-label={o.name}
          size="sm"
          className={cn(
            'h-8 min-w-0 flex-1 rounded-none bg-background px-3 text-sm font-semibold text-foreground hover:bg-muted',
            'data-[state=on]:bg-primary data-[state=on]:text-primary-foreground',
            i > 0 && 'border-l',
          )}
        >
          {o.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
