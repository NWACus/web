'use client'

/** A phone's way through a table's dates: one date's columns at a time, so nothing scrolls. */
import { useId, useState, type ReactNode } from 'react'

import { cn } from '@/utilities/ui'

import { useTabListKeys } from './useTabListKeys'

export function DaySwitch({
  label,
  days,
  className,
}: {
  label: string
  days: { key: string; label: string; content: ReactNode }[]
  className?: string
}) {
  const [active, setActive] = useState(0)
  const id = useId()
  const { onKeyDown, tabRef } = useTabListKeys(days.length, active, setActive)

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
              onClick={() => setActive(i)}
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
