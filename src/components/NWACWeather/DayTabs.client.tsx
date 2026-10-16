'use client'

/**
 * A row of date tabs over one panel per date: the zone's Mountain Weather on a phone, a date at a
 * time. The panels are rendered by the caller; this only picks which shows. Arrow keys move
 * between tabs, as a tablist's do.
 */
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'

import { cn } from '@/utilities/ui'

export interface DayTab {
  key: string
  /** "Mon" */
  dow: string
  /** "Oct 5" */
  date: string
  content: ReactNode
}

export function DayTabs({ days }: { days: DayTab[] }) {
  const [active, setActive] = useState(0)
  const id = useId()
  const tabs = useRef<(HTMLButtonElement | null)[]>([])

  function onKeyDown(event: KeyboardEvent) {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (step === 0) return
    event.preventDefault()
    const next = (active + step + days.length) % days.length
    setActive(next)
    tabs.current[next]?.focus()
  }

  return (
    <div className="space-y-3">
      <div
        role="tablist"
        aria-label="Day"
        className="grid border-b"
        style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
        onKeyDown={onKeyDown}
      >
        {days.map((d, i) => (
          <button
            key={d.key}
            ref={(el) => {
              tabs.current[i] = el
            }}
            type="button"
            role="tab"
            id={`${id}-tab-${i}`}
            aria-selected={i === active}
            aria-controls={`${id}-panel-${i}`}
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
            className={cn(
              '-mb-px min-h-11 border-b-[3px] px-1 py-2 text-center',
              i === active
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground',
            )}
          >
            <span className="block text-xs">{d.dow}</span>
            <span className="block font-semibold">{d.date}</span>
          </button>
        ))}
      </div>
      {days.map((d, i) => (
        <div
          key={d.key}
          role="tabpanel"
          id={`${id}-panel-${i}`}
          aria-labelledby={`${id}-tab-${i}`}
          hidden={i !== active}
          className="space-y-3"
        >
          {d.content}
        </div>
      ))}
    </div>
  )
}
