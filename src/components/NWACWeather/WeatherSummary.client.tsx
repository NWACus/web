'use client'

/**
 * The forecaster's weather summary for each zone (the "sensible weather"), under the synopsis.
 * Secondary to the tables, so it starts collapsed; opened, a tab per zone shows that zone's two
 * days side by side. Arrow keys move between the zone tabs, as a tablist's do.
 */
import { ChevronDown } from 'lucide-react'
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'

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
    <div className="grid gap-4 sm:grid-cols-2">
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
  const [open, setOpen] = useState(false)
  const [zone, setZone] = useState(0)
  const id = useId()
  const row = rows[zone] ?? rows[0]

  // The page's section tabs link here; arriving by that link opens it.
  useEffect(() => {
    const openOnHash = () => {
      if (window.location.hash === `#${headingId}`) setOpen(true)
    }
    openOnHash()
    window.addEventListener('hashchange', openOnHash)
    return () => window.removeEventListener('hashchange', openOnHash)
  }, [headingId])

  return (
    <section aria-labelledby={headingId} className="space-y-3 rounded-md border">
      <h3 id={headingId} className="scroll-mt-24">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`${id}-body`}
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-lg font-semibold"
        >
          Weather Summary
          <ChevronDown
            aria-hidden="true"
            className={cn('size-5 shrink-0 transition-transform', open && 'rotate-180')}
          />
        </button>
      </h3>
      <div id={`${id}-body`} hidden={!open} className="space-y-4 px-4 pb-4 print:block">
        <ZoneTabs rows={rows} active={zone} onPick={setZone} id={id} />
        <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${zone}`}>
          {row && <ZoneDays row={row} days={days} />}
        </div>
      </div>
    </section>
  )
}
