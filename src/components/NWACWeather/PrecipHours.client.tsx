'use client'

/**
 * The 12 / 24 hour switch on the precipitation and snow table: both tables are rendered, and the
 * switch shows one. It sits at the right just above the table, and on a phone beside the date.
 */
import { createContext, useContext, useState, type ReactNode } from 'react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/utilities/ui'

import { PHONE_TRIGGER, SharedDayProvider } from './DaySwitch.client'

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

/** The desktop form, at the right just above the table: the picked option in the primary blue. */
export function PrecipHoursToggle() {
  const { hours, setHours } = useContext(HoursContext)
  return (
    <ToggleGroup
      type="single"
      aria-label="Period length"
      value={hours}
      // Radix sends '' when the pressed item is pressed again; keep the switch on a value.
      onValueChange={(value) => isHours(value) && setHours(value)}
      className="inline-flex shrink-0 gap-0 overflow-hidden rounded-md border text-sm font-semibold"
    >
      {OPTIONS.map((o, i) => (
        <ToggleGroupItem
          key={o.hours}
          value={o.hours}
          aria-label={o.name}
          size="sm"
          className={cn(
            'h-8 min-w-0 rounded-none bg-background px-3 text-sm font-semibold text-foreground hover:bg-muted',
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

/** The phone's form: a dropdown beside the date's. */
export function PrecipHoursSelect() {
  const { hours, setHours } = useContext(HoursContext)
  return (
    <Select value={hours} onValueChange={(value) => isHours(value) && setHours(value)}>
      <SelectTrigger
        aria-label="Period length"
        className={cn(PHONE_TRIGGER, 'w-auto shrink-0 gap-2')}
      >
        <SelectValue>{OPTIONS.find((o) => o.hours === hours)?.name}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {OPTIONS.map((o) => (
          <SelectItem key={o.hours} value={o.hours}>
            {o.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
