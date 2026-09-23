/**
 * The info card for a station: the widget's `InfoStationContent` — name, source, elevation, the
 * reading's time (flagged when older than the center's threshold), and every current reading in
 * the widget's variable order.
 */
import { Calendar, ChartLine, Mountain, Table2, Tag, TriangleAlert } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'

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
              <th scope="row" className="px-2 py-1 text-left font-semibold md:py-1.5">
                {names.get(variable) ?? variable} ({shortUnit(context.units[variable])})
              </th>
              <td className="px-2 py-1 text-right tabular-nums md:py-1.5">{shown ?? '—'}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

// `sm` is the smallest Button size and still 36px tall; the card's footer wants less.
const COMPACT_BUTTON = 'h-7 px-2.5 text-xs'

/**
 * The station's page, opened on its table or its graphs — the widget's modal, or its "Area
 * Tables" and "Area Plots" where a station page lists the station. In a new tab, so the map and
 * its selection stay put.
 */
function StationLinks({ href }: { href: string }) {
  const linkProps = { target: '_blank', rel: 'noopener noreferrer' }
  return (
    <footer className="flex shrink-0 justify-end border-t px-3 py-1.5">
      <ButtonGroup aria-label="Open the station page">
        <Button asChild size="sm" variant="outline" className={COMPACT_BUTTON}>
          <Link href={href} {...linkProps}>
            <Table2 className="mr-1 h-3 w-3" aria-hidden="true" />
            Table
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline" className={COMPACT_BUTTON}>
          <Link href={`${href}?range=graphs`} {...linkProps}>
            <ChartLine className="mr-1 h-3 w-3" aria-hidden="true" />
            Graphs
          </Link>
        </Button>
      </ButtonGroup>
    </footer>
  )
}

export function StationCard({ station, context }: CardProps) {
  return (
    // `min-h-0` lets the readings scroll under the pinned header and footer at the panel's height limit.
    <article className="flex min-h-0 w-full flex-col text-left" data-testid="station-card">
      <CardHeader station={station} context={context} />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain py-1">
        <ReadingRows station={station} context={context} />
      </div>
      <StationLinks href={station.href} />
    </article>
  )
}
