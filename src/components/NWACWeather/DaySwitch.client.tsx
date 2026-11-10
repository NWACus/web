'use client'

/** A phone's way through a table's dates: one date's columns at a time, so nothing scrolls. */
import { createContext, useContext, useId, useState, type ReactNode } from 'react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/utilities/ui'

import { useTabListKeys } from './useTabListKeys'

interface Picked {
  key: string
  index: number
}

/**
 * The picked date, shared by tables a reader swaps between (12 and 24 hours), so swapping keeps
 * the date rather than going back to the first. Their dates can be named differently (a 24-hour
 * range), so a key one doesn't have falls back to the same place in its list.
 */
const SharedDay = createContext<{
  picked: Picked | null
  setPicked: (picked: Picked) => void
} | null>(null)

export function SharedDayProvider({ children }: { children: ReactNode }) {
  const [picked, setPicked] = useState<Picked | null>(null)
  return <SharedDay.Provider value={{ picked, setPicked }}>{children}</SharedDay.Provider>
}

/** A phone dropdown's trigger, the date's and the 12 / 24 hour one alike. */
export const PHONE_TRIGGER = 'h-10 rounded-md text-sm font-semibold'

interface Day {
  key: string
  label: string
  content: ReactNode
}

/**
 * Tabs over the table, or, for a table with another control (`aside`), a date dropdown with that
 * control beside it.
 */
export function DaySwitch({
  label,
  days,
  aside,
  className,
}: {
  label: string
  days: Day[]
  aside?: ReactNode
  className?: string
}) {
  const shared = useContext(SharedDay)
  const [localPicked, setLocalPicked] = useState<Picked | null>(null)
  const picked = shared ? shared.picked : localPicked
  const setPicked = shared ? shared.setPicked : setLocalPicked
  const byKey = days.findIndex((d) => d.key === picked?.key)
  const active = byKey >= 0 ? byKey : Math.min(picked?.index ?? 0, days.length - 1)
  const pick = (index: number) => setPicked({ key: days[index].key, index })

  if (!aside) {
    return <DayTabs label={label} days={days} active={active} pick={pick} className={className} />
  }
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        {days.length > 1 && (
          <Select
            value={days[active].key}
            onValueChange={(key) => pick(days.findIndex((d) => d.key === key))}
          >
            <SelectTrigger
              aria-label={`${label} date`}
              className={cn(PHONE_TRIGGER, 'min-w-0 flex-1')}
            >
              {/* The label itself, so the server's HTML shows it before the select hydrates. */}
              <SelectValue>{days[active].label}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {days.map((d) => (
                <SelectItem key={d.key} value={d.key}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {aside}
      </div>
      {/* Only the picked date's table is drawn. */}
      <div>{days[active]?.content}</div>
    </div>
  )
}

function DayTabs({
  label,
  days,
  active,
  pick,
  className,
}: {
  label: string
  days: Day[]
  active: number
  pick: (index: number) => void
  className?: string
}) {
  const id = useId()
  const { onKeyDown, tabRef } = useTabListKeys(days.length, active, pick)

  return (
    <div className={cn('space-y-2', className)}>
      {days.length > 1 && (
        <div
          role="tablist"
          aria-label={`${label} date`}
          onKeyDown={onKeyDown}
          className="grid auto-cols-fr grid-flow-col gap-1 rounded-lg bg-muted p-1"
        >
          {days.map((d, i) => (
            <button
              key={d.key}
              ref={tabRef(i)}
              type="button"
              role="tab"
              id={`${id}-tab-${i}`}
              aria-selected={i === active}
              aria-controls={`${id}-panel-${i}`}
              tabIndex={i === active ? 0 : -1}
              onClick={() => pick(i)}
              className={cn(
                'min-h-10 rounded-md px-1 py-1 leading-tight',
                days.length > 3 ? 'text-xs' : 'text-sm',
                i === active
                  ? 'bg-card font-semibold text-foreground shadow-sm'
                  : 'font-medium text-muted-foreground',
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
      )}
      {days.map((d, i) => (
        <div
          key={d.key}
          role={days.length > 1 ? 'tabpanel' : undefined}
          id={`${id}-panel-${i}`}
          aria-labelledby={days.length > 1 ? `${id}-tab-${i}` : undefined}
          hidden={i !== active}
        >
          {/* Only the shown date's table is drawn; the rest stay as empty panels for their tabs. */}
          {i === active && d.content}
        </div>
      ))}
    </div>
  )
}
