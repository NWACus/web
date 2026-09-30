'use client'

/**
 * Sensible weather one day at a time: a switch between its two days, each with its date, over a
 * Zone | Forecast table. Narrow enough to sit beside the Snow table.
 */
import { useState } from 'react'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

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

function DaySwitch({
  days,
  active,
  onPick,
}: {
  days: SensibleDay[]
  active: string | undefined
  onPick: (key: string) => void
}) {
  if (days.length < 2) return null
  return (
    <ToggleGroup
      type="single"
      value={active}
      // Radix clears the value when the pressed item is pressed again; keep one shown.
      onValueChange={(value) => value && onPick(value)}
      aria-label="Day"
      className="inline-flex rounded-md bg-muted p-1 print:hidden"
    >
      {days.map((d) => (
        <ToggleGroupItem
          key={d.key}
          value={d.key}
          size="sm"
          className="whitespace-nowrap font-semibold data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm"
        >
          {d.label}
          {d.date && <span className="font-normal text-muted-foreground">{d.date}</span>}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

function DayTable({ rows, dayKey }: { rows: SensibleRow[]; dayKey: string | undefined }) {
  return (
    <div className="overflow-hidden rounded-md border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-muted">
            <th scope="col" className="border-b p-2 pl-3 text-left font-semibold">
              Zone
            </th>
            <th scope="col" className="border-b p-2 text-left font-semibold">
              Forecast
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key}>
              <th
                scope="row"
                className="whitespace-nowrap border-t p-2 pl-3 text-left align-top font-semibold"
              >
                {r.zone}
              </th>
              <td className="whitespace-pre-line border-t p-2 align-top">
                {(dayKey && r.text[dayKey]) || <span className="text-muted-foreground">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function SensibleDays({
  headingId,
  days,
  rows,
}: {
  headingId: string
  days: SensibleDay[]
  rows: SensibleRow[]
}) {
  const [active, setActive] = useState(days[0]?.key)
  const day = days.find((d) => d.key === active) ?? days[0]

  return (
    <section aria-labelledby={headingId} className="min-w-0 space-y-2">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 id={headingId} className="scroll-mt-24 text-lg font-semibold">
            Sensible Weather
          </h3>
          <p className="text-sm text-muted-foreground">Expected conditions by zone.</p>
        </div>
        <DaySwitch days={days} active={active} onPick={setActive} />
      </div>
      <DayTable rows={rows} dayKey={day?.key} />
    </section>
  )
}
