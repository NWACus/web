'use client'

/** A phone's way through a table's dates: one date's columns at a time, so nothing scrolls. */
import { createContext, useContext, useId, useState, type ReactNode } from 'react'

import { cn } from '@/utilities/ui'

import { useTabListKeys } from './useTabListKeys'

interface Picked {
  key: string
  index: number
  covers?: string[]
}

/**
 * The picked date, shared by tables a reader swaps between (12 and 24 hours), so swapping keeps
 * the date rather than going back to the first. Their dates can be named differently (a 24-hour
 * range), so a key one doesn't have falls back to the first day covering the picked one's last
 * date, then to the same place in its list.
 */
const SharedDay = createContext<{
  picked: Picked | null
  setPicked: (picked: Picked) => void
} | null>(null)

export function SharedDayProvider({ children }: { children: ReactNode }) {
  const [picked, setPicked] = useState<Picked | null>(null)
  return <SharedDay.Provider value={{ picked, setPicked }}>{children}</SharedDay.Provider>
}

interface Day {
  key: string
  label: string
  /** The tab's text in place of `label`, when that is too long for it. */
  short?: ReactNode
  /** The dates it covers, matched when another table's key isn't one of these. */
  covers?: string[]
  content: ReactNode
}

/** Tabs over the table, one per date. */
export function DaySwitch({
  label,
  days,
  className,
}: {
  label: string
  days: Day[]
  className?: string
}) {
  const shared = useContext(SharedDay)
  const [localPicked, setLocalPicked] = useState<Picked | null>(null)
  const picked = shared ? shared.picked : localPicked
  const setPicked = shared ? shared.setPicked : setLocalPicked
  const pick = (index: number) =>
    setPicked({ key: days[index].key, index, covers: days[index].covers })
  return (
    <DayTabs
      label={label}
      days={days}
      active={activeDay(days, picked)}
      pick={pick}
      className={className}
    />
  )
}

function activeDay(days: Day[], picked: Picked | null): number {
  const byKey = days.findIndex((d) => d.key === picked?.key)
  if (byKey >= 0) return byKey
  const lastDate = picked?.covers?.at(-1)
  const byDate = lastDate ? days.findIndex((d) => d.covers?.includes(lastDate)) : -1
  if (byDate >= 0) return byDate
  return Math.min(picked?.index ?? 0, days.length - 1)
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
                'min-h-11 rounded-md px-1 py-1 leading-tight',
                days.length > 3 && !d.short ? 'text-xs' : 'text-sm',
                i === active
                  ? 'bg-card font-semibold text-foreground shadow-sm'
                  : 'font-medium text-muted-foreground',
              )}
            >
              {d.short ?? d.label}
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
