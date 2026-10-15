'use client'

/**
 * The forecaster's weather summary for each zone (the "sensible weather"), beside the synopsis: a
 * tab per day shows every zone's text for it, so the zones compare. Arrow keys move between the
 * day tabs, as a tablist's do.
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

function DayTabs({
  days,
  active,
  onPick,
  id,
}: {
  days: SensibleDay[]
  active: number
  onPick: (index: number) => void
  id: string
}) {
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  function onKeyDown(event: KeyboardEvent) {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (step === 0) return
    event.preventDefault()
    const next = (active + step + days.length) % days.length
    onPick(next)
    tabs.current[next]?.focus()
  }
  return (
    <div role="tablist" aria-label="Day" className="flex border-b" onKeyDown={onKeyDown}>
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
          aria-controls={`${id}-panel`}
          tabIndex={i === active ? 0 : -1}
          onClick={() => onPick(i)}
          className={cn(
            '-mb-px min-h-11 whitespace-nowrap border-b-2 px-3',
            i === active
              ? 'border-foreground font-semibold text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          {d.label}
          {d.date && <span className="font-normal text-muted-foreground"> · {d.date}</span>}
        </button>
      ))}
    </div>
  )
}

/** Every zone's text for the day, a zone to a line. */
function DayZones({ day, rows }: { day: SensibleDay; rows: SensibleRow[] }) {
  return (
    <dl className="divide-y divide-muted">
      {rows.map((r) => (
        <div key={r.key} className="grid gap-x-3 gap-y-0.5 py-2 sm:grid-cols-[8rem_minmax(0,1fr)]">
          <dt className="font-semibold">{r.zone}</dt>
          <dd className="whitespace-pre-line">
            {r.text[day.key] || <span className="text-muted-foreground">—</span>}
          </dd>
        </div>
      ))}
    </dl>
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
  const [active, setActive] = useState(0)
  const id = useId()
  const day = days[active] ?? days[0]

  return (
    <section aria-labelledby={headingId} className="space-y-3">
      <h3 id={headingId} className="scroll-mt-24 text-lg font-semibold">
        Weather Summary
      </h3>
      <DayTabs days={days} active={active} onPick={setActive} id={id} />
      <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${active}`}>
        {day && <DayZones day={day} rows={rows} />}
      </div>
    </section>
  )
}
