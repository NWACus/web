'use client'

/**
 * The forecaster's weather summary for each zone (the "sensible weather"), beside the synopsis: a
 * list of the zones beside the picked zone's two days. Arrow keys move between the zones, as a
 * tablist's do.
 */
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
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
  /** The zone's avalanche forecast page, when it has one. */
  href?: string
}

function ZoneDays({ row, days }: { row: SensibleRow; days: SensibleDay[] }) {
  return (
    <div className="space-y-3">
      {days.map((d) => (
        <section key={d.key} className="space-y-0.5">
          <h4>
            <span className="font-semibold">{d.label}</span>
            {d.date && <span className="text-muted-foreground"> · {d.date}</span>}
          </h4>
          <p className="whitespace-pre-line">
            {row.text[d.key] || <span className="text-muted-foreground">—</span>}
          </p>
        </section>
      ))}
      {row.href && (
        <Link
          href={row.href}
          className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
        >
          {row.zone} forecast
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      )}
    </div>
  )
}

/** The zones as a vertical tablist; on a phone, a row that scrolls sideways. */
function ZoneList({
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
    const back = event.key === 'ArrowUp' || event.key === 'ArrowLeft'
    const forward = event.key === 'ArrowDown' || event.key === 'ArrowRight'
    if (!back && !forward) return
    event.preventDefault()
    const next = (active + (forward ? 1 : -1) + rows.length) % rows.length
    onPick(next)
    tabs.current[next]?.focus()
  }
  return (
    <div
      role="tablist"
      aria-label="Zone"
      aria-orientation="vertical"
      onKeyDown={onKeyDown}
      className="flex overflow-x-auto border-b sm:flex-col sm:overflow-visible sm:border-b-0 sm:border-r"
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
            '-mb-px min-h-11 shrink-0 whitespace-nowrap border-b-2 px-3 text-left text-sm sm:-mr-px sm:mb-0 sm:min-h-9 sm:border-b-0 sm:border-r-2',
            i === active
              ? 'border-foreground bg-muted font-semibold text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          {r.zone}
        </button>
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
        Weather Summary by Zone
      </h3>
      <div className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start">
        <ZoneList rows={rows} active={zone} onPick={setZone} id={id} />
        <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${zone}`}>
          {row && <ZoneDays row={row} days={days} />}
        </div>
      </div>
    </section>
  )
}
