'use client'

/**
 * The station map's table view: the widget's `StationTable.vue` — every visible station's current
 * readings, one row each, grouped under its zone and sorted within it.
 *
 * The rules (columns, sort, grouping, thresholds) are in `src/services/snowobs/stationMap/table`;
 * this renders them. The header and the station column stay put while the table scrolls, so a
 * phone can pan across twenty readings without losing which station or reading it is looking at.
 */
import { ArrowDown, ArrowUp, ChevronsUpDown, TriangleAlert } from 'lucide-react'
import Link from 'next/link'
import type { RefObject } from 'react'
import { useEffect, useMemo } from 'react'

import type { StationAges } from '@/services/snowobs/stationMap/filters'
import { formatObservedTime, shortUnit } from '@/services/snowobs/stationMap/format'
import type { StationMapStation, StationMapVariable } from '@/services/snowobs/stationMap/model'
import {
  ELEVATION_COLUMN,
  STATION_COLUMN,
  TIME_COLUMN,
  columnLabel,
  groupStations,
  readingColumns,
  tableColumns,
  thresholdCrossing,
  timeZoneLabel,
  type TableGroup,
  type TableSort,
  type ThresholdLevel,
} from '@/services/snowobs/stationMap/table'
import { cn } from '@/utilities/ui'

export interface StationTableContext {
  variables: StationMapVariable[]
  units: Record<string, string>
  zoneNames: string[]
  timezone: string
  ages: StationAges
  /** The center's staleness threshold, in minutes. */
  staleAfterMinutes: number
  /** Color readings that cross the widget's thresholds. */
  colorRules: boolean
}

export interface StationTableProps {
  stations: StationMapStation[]
  context: StationTableContext
  sort: TableSort
  onSort: (column: string) => void
  /** The stid the search (or a legacy link) picked out. */
  highlighted: string | null
  onOpenStation: () => void
  frameRef: RefObject<HTMLDivElement | null>
}

/** The widget's Bootstrap `bg-warning`-family colors, so a forecaster sees the same cells lit. */
const THRESHOLD_CLASSES: Record<ThresholdLevel, string> = {
  yellow: 'bg-[#ffc107]',
  orange: 'bg-[#fd7e14]',
  red: 'bg-[#dc3545] text-white',
}

export function stationRowId(stid: string): string {
  return `station-table-${stid}`
}

// --- Header --------------------------------------------------------------------------------------

interface ColumnHeading {
  column: string
  label: string
  unit: string
  /** The widget's header tooltip: the long name, and the unit when there is one. */
  title: string
}

function metadataHeading(column: string, context: StationTableContext): ColumnHeading {
  if (column === STATION_COLUMN) return { column, label: 'Station', unit: '', title: 'Station' }
  if (column === ELEVATION_COLUMN) {
    // SnowObs reports elevation in feet whatever units it was asked for; the widget said "ft" too.
    return { column, label: columnLabel(column), unit: 'ft', title: 'Elevation (ft)' }
  }
  const unit = timeZoneLabel(context.timezone, new Date())
  return { column, label: columnLabel(column), unit, title: `Date Time (${unit})` }
}

function columnHeadings(context: StationTableContext): ColumnHeading[] {
  const names = new Map(context.variables.map((v) => [v.variable, v.longName]))
  return tableColumns(context.variables).map((column) => {
    if (column === STATION_COLUMN || column === ELEVATION_COLUMN || column === TIME_COLUMN) {
      return metadataHeading(column, context)
    }
    const unit = shortUnit(context.units[column])
    const name = names.get(column) ?? column
    return { column, label: columnLabel(column), unit, title: unit ? `${name} (${unit})` : name }
  })
}

function SortIcon({ direction }: { direction: TableSort['direction'] | null }) {
  const Icon = direction === 'asc' ? ArrowUp : direction === 'desc' ? ArrowDown : ChevronsUpDown
  return (
    <Icon
      className={cn('h-3 w-3 shrink-0', direction === null && 'text-muted-foreground')}
      aria-hidden="true"
    />
  )
}

function ariaSort(direction: TableSort['direction'] | null) {
  if (direction === null) return undefined
  return direction === 'asc' ? 'ascending' : 'descending'
}

function HeaderCell({
  heading,
  sort,
  onSort,
}: {
  heading: ColumnHeading
  sort: TableSort
  onSort: (column: string) => void
}) {
  const direction = sort.column === heading.column ? sort.direction : null
  const isStation = heading.column === STATION_COLUMN
  return (
    <th
      scope="col"
      aria-sort={ariaSort(direction)}
      className={cn('whitespace-nowrap px-1 py-1 align-bottom font-normal', isStation && 'left-0')}
    >
      <button
        type="button"
        title={heading.title}
        onClick={() => onSort(heading.column)}
        className={cn(
          'inline-flex w-full items-end gap-1 rounded px-1 hover:bg-muted focus-visible:outline focus-visible:outline-2',
          isStation ? 'justify-start text-left' : 'justify-center text-center',
        )}
      >
        <span className="flex flex-col">
          <span className="font-semibold">{heading.label}</span>
          <span className="min-h-4 text-[0.7rem] text-muted-foreground">{heading.unit}</span>
          {/* The abbreviations are forecaster shorthand; the tooltip isn't reachable by touch or a screen reader. */}
          {heading.title !== heading.label && <span className="sr-only">, {heading.title}</span>}
        </span>
        <SortIcon direction={direction} />
      </button>
    </th>
  )
}

// --- Body ----------------------------------------------------------------------------------------

/** The station's detail page — the native stand-in for the widget table's 24h station modal. */
function StationName({ station, onOpen }: { station: StationMapStation; onOpen: () => void }) {
  return (
    <Link
      href={station.href}
      onClick={onOpen}
      className="text-primary underline-offset-2 hover:underline"
    >
      {station.name}
    </Link>
  )
}

function ObservedTime({
  station,
  context,
}: {
  station: StationMapStation
  context: StationTableContext
}) {
  const age = context.ages.get(station.stid) ?? Infinity
  const stale = age > context.staleAfterMinutes
  const warning = `Data is older than ${context.staleAfterMinutes / 60} hours`
  return (
    <span className="inline-flex items-center gap-1">
      {formatObservedTime(station.observedAt, context.timezone)}
      {stale && (
        <span title={warning} className="inline-flex text-red-600">
          <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="sr-only">({warning})</span>
        </span>
      )}
    </span>
  )
}

function ReadingCell({
  station,
  variable,
  context,
}: {
  station: StationMapStation
  variable: string
  context: StationTableContext
}) {
  const value = station.data[variable]
  const unit = context.units[variable]
  const crossing = context.colorRules ? thresholdCrossing(variable, value, unit) : null
  if (!crossing) return <td className="px-2 py-1">{value ?? ''}</td>
  // Color alone says nothing to a screen reader or a color-blind reader; the widget's (disabled)
  // tooltip wording says it in words.
  const note = `Value greater than ${crossing.above} ${shortUnit(unit)}`
  return (
    <td title={note} className={cn('px-2 py-1', THRESHOLD_CLASSES[crossing.level])}>
      {value}
      <span className="sr-only"> ({note})</span>
    </td>
  )
}

function StationRow({
  station,
  variables,
  context,
  highlighted,
  onOpenStation,
}: {
  station: StationMapStation
  variables: string[]
  context: StationTableContext
  highlighted: boolean
  onOpenStation: () => void
}) {
  return (
    <tr
      id={stationRowId(station.stid)}
      aria-current={highlighted || undefined}
      className={highlighted ? 'bg-red-200' : 'bg-background even:bg-muted'}
    >
      <th
        scope="row"
        title={station.name}
        // Focusable from script only: a search pick moves focus here, so it lands where the reader is looking.
        tabIndex={-1}
        className="sticky left-0 z-10 bg-inherit px-2 py-1 text-left font-normal focus-visible:outline-none"
      >
        {/* A width on the cell itself is only a suggestion in an auto-layout table; a block isn't. */}
        <div className="w-[150px] truncate">
          <StationName station={station} onOpen={onOpenStation} />
        </div>
      </th>
      <td className="px-2 py-1">{station.elevation ?? ''}</td>
      <td className="whitespace-nowrap px-2 py-1">
        <ObservedTime station={station} context={context} />
      </td>
      {variables.map((variable) => (
        <ReadingCell key={variable} station={station} variable={variable} context={context} />
      ))}
    </tr>
  )
}

function ZoneGroup({
  group,
  columnCount,
  variables,
  context,
  highlighted,
  onOpenStation,
}: {
  group: TableGroup
  columnCount: number
  variables: string[]
  context: StationTableContext
  highlighted: string | null
  onOpenStation: () => void
}) {
  return (
    <tbody>
      <tr className="bg-neutral-300">
        <th scope="rowgroup" colSpan={columnCount} className="px-2 py-1 text-left font-bold">
          {/* Kept in view while the readings scroll sideways under it. */}
          <span className="sticky left-2 inline-block">{group.zone}</span>
        </th>
      </tr>
      {group.stations.map((station) => (
        <StationRow
          key={`${station.source}:${station.stid}`}
          station={station}
          variables={variables}
          context={context}
          highlighted={station.stid === highlighted}
          onOpenStation={onOpenStation}
        />
      ))}
    </tbody>
  )
}

/**
 * Bring the picked-out row into view and focus its station — once its row exists, so a legacy link
 * waits for the data.
 */
function useScrollToHighlighted(highlighted: string | null, hasRows: boolean) {
  useEffect(() => {
    if (!highlighted || !hasRows) return
    const row = document.getElementById(stationRowId(highlighted))
    row?.scrollIntoView({ block: 'center', inline: 'start' })
    row?.querySelector<HTMLElement>('th')?.focus({ preventScroll: true })
  }, [highlighted, hasRows])
}

export function StationTable({
  stations,
  context,
  sort,
  onSort,
  highlighted,
  onOpenStation,
  frameRef,
}: StationTableProps) {
  const groups = useMemo(
    () => groupStations(stations, context.zoneNames, sort),
    [stations, context.zoneNames, sort],
  )
  const headings = columnHeadings(context)
  const variables = readingColumns(context.variables)
  useScrollToHighlighted(highlighted, groups.length > 0)

  return (
    <div
      ref={frameRef}
      role="region"
      aria-label="Current station readings"
      tabIndex={0}
      // Capped at what's left of the viewport, as the map is, so the toolbar stays in reach.
      // `isolate` keeps the sticky cells' z-indexes inside the table, clear of the search results.
      className="relative isolate -mx-4 max-h-[calc(100dvh-14rem)] overflow-auto border-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:mx-0 md:border"
      data-testid="station-table"
    >
      <table className="w-full border-separate border-spacing-0 text-center text-xs tabular-nums sm:text-[13px]">
        {/* Sticky on the cells rather than the thead: a sticky thead lags behind a fling on iOS. */}
        <thead className="[&_th]:sticky [&_th]:top-0 [&_th]:z-20 [&_th]:bg-background [&_th]:shadow-[inset_0_-1px_0_var(--border)] [&_th:first-child]:z-30">
          <tr>
            {headings.map((heading) => (
              <HeaderCell key={heading.column} heading={heading} sort={sort} onSort={onSort} />
            ))}
          </tr>
        </thead>
        {groups.map((group) => (
          <ZoneGroup
            key={group.zone}
            group={group}
            columnCount={headings.length}
            variables={variables}
            context={context}
            highlighted={highlighted}
            onOpenStation={onOpenStation}
          />
        ))}
      </table>
    </div>
  )
}
