/**
 * The info card for a station: the widget's `InfoStationContent` — name, source, elevation, the
 * reading's time (flagged when older than the center's threshold), and every current reading in
 * the widget's variable order.
 */
import { Calendar, ChevronRight, Mountain, Tag, TriangleAlert } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

import {
  formatObservedAt,
  orderVariables,
  shortUnit,
  sourceLabel,
  windDirectionLabel,
} from '@/services/snowobs/stationMap/format'
import type {
  StationMapStation,
  StationMapUnits,
  StationMapVariable,
} from '@/services/snowobs/stationMap/model'
import { cn } from '@/utilities/ui'

export interface StationCardContext {
  variables: StationMapVariable[]
  units: Record<string, string>
  timezone: string
  displayUnits: StationMapUnits
  /** Minutes since the reading — `Infinity` when there is none. */
  ageMinutes: number
  /** The center's staleness threshold, in minutes. */
  staleAfterMinutes: number
}

interface CardProps {
  station: StationMapStation
  context: StationCardContext
}

function Elevation({ station, context }: CardProps) {
  if (station.elevation === null) return null
  return (
    <span className="inline-flex items-center gap-1">
      <Mountain className="h-3 w-3" aria-hidden="true" />
      <span className="sr-only">Elevation </span>
      {station.elevation}
      {context.displayUnits === 'metric' ? ' m' : "'"}
    </span>
  )
}

function ObservedAt({ station, context }: CardProps) {
  const stale = context.ageMinutes > context.staleAfterMinutes
  return (
    <span className={cn('inline-flex items-center gap-1', stale && 'font-semibold text-red-600')}>
      <Calendar className="h-3 w-3" aria-hidden="true" />
      <span className="sr-only">Observed </span>
      {formatObservedAt(station.observedAt, context.timezone)}
      {stale && (
        <>
          <TriangleAlert className="h-3 w-3" aria-hidden="true" />
          <span className="sr-only">(data may be stale)</span>
        </>
      )}
    </span>
  )
}

function CardHeader({ station, context }: CardProps) {
  return (
    <header className="border-b px-3 py-2">
      <h3 className="text-base font-bold leading-tight">{station.name}</h3>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-neutral-600">
        <span className="inline-flex items-center gap-1 uppercase">
          <Tag className="h-3 w-3" aria-hidden="true" />
          {sourceLabel(station.source)}
        </span>
        <Elevation station={station} context={context} />
        <ObservedAt station={station} context={context} />
      </div>
    </header>
  )
}

function ReadingRows({ station, context }: CardProps) {
  const names = new Map(context.variables.map((v) => [v.variable, v.longName]))
  const rows = orderVariables(Object.keys(station.data))

  if (rows.length === 0) {
    return <p className="px-3 py-2 text-xs text-neutral-500">No current readings.</p>
  }

  return (
    <table className="w-full text-xs">
      <tbody>
        {rows.map((variable, index) => {
          const value = station.data[variable]
          const shown = variable === 'wind_direction' ? windDirectionLabel(value) : value
          return (
            <tr key={variable} className={cn(index % 2 === 0 && 'bg-neutral-100')}>
              <th scope="row" className="px-2 py-0.5 text-left font-semibold">
                {names.get(variable) ?? variable} ({shortUnit(context.units[variable])})
              </th>
              <td className="px-2 py-0.5 text-right tabular-nums">{shown ?? '—'}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

const CARD_CLASS =
  'block w-full overflow-hidden rounded-md bg-white text-left text-sm text-neutral-900 shadow-md'

/** The whole card is the link when there is a page to go to, as the widget's card opened the station. */
function CardShell({ href, children }: { href: string | null; children: ReactNode }) {
  if (!href) {
    return (
      <article className={CARD_CLASS} data-testid="station-card">
        {children}
      </article>
    )
  }
  return (
    <Link
      href={href}
      className={cn(CARD_CLASS, 'transition-shadow hover:shadow-[0_5px_15px_rgba(0,0,0,0.35)]')}
      data-testid="station-card"
    >
      {children}
    </Link>
  )
}

export function StationCard({ station, context }: CardProps) {
  return (
    <CardShell href={station.href}>
      <CardHeader station={station} context={context} />
      <div className="max-h-[200px] overflow-y-auto py-1">
        <ReadingRows station={station} context={context} />
      </div>
      {station.href && (
        <footer className="flex items-center justify-end gap-1 border-t px-3 py-1.5 text-xs font-semibold text-primary">
          View station
          <ChevronRight className="h-3 w-3" aria-hidden="true" />
        </footer>
      )}
    </CardShell>
  )
}
