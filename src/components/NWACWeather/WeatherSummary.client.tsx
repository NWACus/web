'use client'

/**
 * The forecaster's weather summary for each zone (the "sensible weather"), beside the synopsis: a
 * tab per zone shows that zone's two days. Arrow keys move between the zone tabs, as a tablist's
 * do.
 */
import { useId, useRef, useState, type KeyboardEvent } from 'react'

import { cn } from '@/utilities/ui'

export interface SensibleDay {
  key: string
  /** "Today / Tonight", "Tonight" or "Tomorrow", as the issuance's periods fall. */
  label: string
  /** "Tue Sep 29"; null when the issuance has no date for the slot. */
  date: string | null
}

export interface SensibleRow {
  key: string
  zone: string
  /** Forecast text by day key. */
  text: Record<string, string>
}

function ZoneTabs({
  rows,
  active,
  onPick,
  id,
}: {
  rows: SensibleRow[]
  active: number
  onPick: (index: number) => void
  id: string
}) {
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  function onKeyDown(event: KeyboardEvent) {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (step === 0) return
    event.preventDefault()
    const next = (active + step + rows.length) % rows.length
    onPick(next)
    tabs.current[next]?.focus()
  }
  return (
    <div
      role="tablist"
      aria-label="Zone"
      className="flex gap-1 overflow-x-auto border-b"
      onKeyDown={onKeyDown}
    >
      {rows.map((r, i) => (
        <button
          key={r.key}
          ref={(el) => {
            tabs.current[i] = el
          }}
          type="button"
          role="tab"
          id={`${id}-tab-${i}`}
          aria-selected={i === active}
          aria-controls={`${id}-panel`}
          tabIndex={i === active ? 0 : -1}
          onClick={() => onPick(i)}
          className={cn(
            '-mb-px min-h-11 shrink-0 whitespace-nowrap border-b-2 px-3 text-sm',
            i === active
              ? 'border-foreground font-semibold text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          {r.zone}
        </button>
      ))}
    </div>
  )
}

function ZoneDays({ row, days }: { row: SensibleRow; days: SensibleDay[] }) {
  return (
    <div className="space-y-4">
      {days.map((d) => (
        <section key={d.key} className="space-y-1">
          <h4>
            <span className="font-semibold">{d.label}</span>
            {d.date && <span className="text-muted-foreground"> · {d.date}</span>}
          </h4>
          <p className="whitespace-pre-line">
            {row.text[d.key] || <span className="text-muted-foreground">—</span>}
          </p>
        </section>
      ))}
    </div>
  )
}

export function WeatherSummary({
  headingId,
  days,
  rows,
}: {
  headingId: string
  days: SensibleDay[]
  rows: SensibleRow[]
}) {
  const [zone, setZone] = useState(0)
  const id = useId()
  const row = rows[zone] ?? rows[0]

  return (
    <section aria-labelledby={headingId} className="space-y-3">
      <h3 id={headingId} className="scroll-mt-24 text-lg font-semibold">
        Weather Summary
      </h3>
      <ZoneTabs rows={rows} active={zone} onPick={setZone} id={id} />
      <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${zone}`}>
        {row && <ZoneDays row={row} days={days} />}
      </div>
    </section>
  )
}
