'use client'

import { TableBody, TableCell, TableHead, TableRow } from '@/components/ui/table'
import type { UnitSystem } from '@/services/snowobs/metricUnits'
import type {
  PrecipAccumulationTable as PrecipAccumulationData,
  PrecipAccumulationRow,
} from '@/services/snowobs/tableHelpers'
import { PRECIP_ACCUMULATION_WINDOWS } from '@/services/snowobs/tableHelpers'
import type { PrecipColumn } from '@/services/stations/precipColumns'
import { ALL_PRECIP_COLUMNS } from '@/services/stations/precipColumns'
import { cn } from '@/utilities/ui'
import { ChevronDown, ChevronsUpDown, ChevronUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import { StationTableFrame, StationTableHeader } from './StationTableFrame'
import { UnitToggle } from './UnitToggle'

// Totals come from the API in inches, elevation in feet; metric converts on display.
type Unit = UnitSystem
const PRECIP_UNIT: Record<Unit, string> = { imperial: 'in', metric: 'mm' }
const ELEVATION_UNIT: Record<Unit, string> = { imperial: 'ft', metric: 'm' }
function formatTotal(value: number, unit: Unit): string {
  return unit === 'metric' ? (value * 25.4).toFixed(1) : value.toFixed(2)
}

// Sortable columns: station name, each trailing window (by hours), and the
// metadata columns. Numbers default to descending, name to ascending.
type SortKey = 'name' | 'lastUpdate' | 'latitude' | 'longitude' | 'elevation' | number
type SortState = { key: SortKey; desc: boolean }

function sortValue(row: PrecipAccumulationRow, key: SortKey): string | number | null {
  if (typeof key === 'number') return row.totals[key]
  if (key === 'name') return row.name
  if (key === 'lastUpdate') return row.lastUpdateMs
  return row[key]
}

function compareValues(av: string | number, bv: string | number): number {
  if (typeof av === 'string') return av.localeCompare(String(bv))
  return Number(av) - Number(bv)
}

// Nulls sink to the bottom regardless of direction ("missing" stays last).
function compareRows(a: PrecipAccumulationRow, b: PrecipAccumulationRow, sort: SortState): number {
  const av = sortValue(a, sort.key)
  const bv = sortValue(b, sort.key)
  if (av === null || bv === null) return Number(av === null) - Number(bv === null)
  return sort.desc ? -compareValues(av, bv) : compareValues(av, bv)
}

function SortIcon({ active, desc }: { active: boolean; desc: boolean }) {
  if (!active) {
    return (
      <ChevronsUpDown
        className="h-4 w-4 text-muted-foreground group-hover:text-foreground"
        aria-hidden
      />
    )
  }
  return desc ? (
    <ChevronDown className="h-4 w-4" aria-hidden />
  ) : (
    <ChevronUp className="h-4 w-4" aria-hidden />
  )
}

function headAriaSort(active: boolean, desc: boolean): 'ascending' | 'descending' | undefined {
  if (!active) return undefined
  return desc ? 'descending' : 'ascending'
}

// Persistent affordance (EventsTable pattern): neutral up/down chevrons on
// every sortable header, solid arrow on the active one.
function SortButton({
  label,
  sublabel,
  active,
  desc,
  onClick,
}: {
  label: string
  sublabel?: string
  active: boolean
  desc: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group cursor-pointer"
      title={`Sort by ${label}`}
    >
      <span className="inline-flex items-center gap-1 font-semibold text-foreground">
        {label}
        <SortIcon active={active} desc={desc} />
      </span>
      {sublabel && <div className="text-sm font-normal text-muted-foreground">{sublabel}</div>}
    </button>
  )
}

type HeadSortState = { active: boolean; desc: boolean; onClick: () => void }

function SortableHead({
  label,
  sublabel,
  state,
  sticky = false,
}: {
  label: string
  sublabel?: string
  state: HeadSortState
  sticky?: boolean
}) {
  return (
    <TableHead
      aria-sort={headAriaSort(state.active, state.desc)}
      className={cn(
        'whitespace-nowrap px-2 text-right align-top',
        sticky && 'sticky left-0 z-10 bg-background text-left',
      )}
    >
      <SortButton
        label={label}
        sublabel={sublabel}
        active={state.active}
        desc={state.desc}
        onClick={state.onClick}
      />
    </TableHead>
  )
}

function formatLatitude(row: PrecipAccumulationRow): string {
  return row.latitude != null ? row.latitude.toFixed(4) : '–'
}

// Displayed as an absolute value under a °W sublabel (all NWAC stations are west).
function formatLongitude(row: PrecipAccumulationRow): string {
  return row.longitude != null ? Math.abs(row.longitude).toFixed(4) : '–'
}

function formatElevation(row: PrecipAccumulationRow, unit: Unit): string {
  if (row.elevation == null) return '–'
  const value = unit === 'metric' ? Math.round(row.elevation * 0.3048) : row.elevation
  return value.toLocaleString()
}

type Window = (typeof PRECIP_ACCUMULATION_WINDOWS)[number]
const META_COLUMNS = ['lastUpdate', 'latitude', 'longitude', 'elevation'] as const
type MetaColumn = (typeof META_COLUMNS)[number]

function toMetaColumn(column: PrecipColumn): MetaColumn | undefined {
  return META_COLUMNS.find((c) => c === column)
}

// The chosen columns in their saved order. Adjacent windows form one run so a
// station without data can collapse each run to a single "missing" cell.
type ColumnGroup = { kind: 'windows'; windows: Window[] } | { kind: 'meta'; column: MetaColumn }

function toWindow(column: PrecipColumn): Window | undefined {
  return PRECIP_ACCUMULATION_WINDOWS.find((hours) => `${hours}h` === column)
}

function groupColumns(columns: PrecipColumn[]): ColumnGroup[] {
  const groups: ColumnGroup[] = []
  for (const column of columns) {
    const hours = toWindow(column)
    const meta = toMetaColumn(column)
    const last = groups.at(-1)
    if (meta) groups.push({ kind: 'meta', column: meta })
    else if (hours !== undefined && last?.kind === 'windows') last.windows.push(hours)
    else if (hours !== undefined) groups.push({ kind: 'windows', windows: [hours] })
  }
  return groups
}

function MetaCell({
  row,
  unit,
  column,
}: {
  row: PrecipAccumulationRow
  unit: Unit
  column: MetaColumn
}) {
  if (column === 'lastUpdate') {
    const noReport = !row.lastUpdate
    return (
      <TableCell
        className={cn(
          'whitespace-nowrap px-2 py-1.5 text-right',
          noReport && 'text-muted-foreground',
        )}
      >
        {noReport ? 'no report in 72H' : row.lastUpdate}
      </TableCell>
    )
  }
  const value =
    column === 'latitude'
      ? formatLatitude(row)
      : column === 'longitude'
        ? formatLongitude(row)
        : formatElevation(row, unit)
  return <TableCell className="px-2 py-1.5 text-right">{value}</TableCell>
}

function StationRow({
  row,
  unit,
  groups,
}: {
  row: PrecipAccumulationRow
  unit: Unit
  groups: ColumnGroup[]
}) {
  return (
    <TableRow className="bg-background even:bg-muted">
      <TableCell className="sticky left-0 z-10 whitespace-nowrap bg-inherit px-2 py-1.5 font-medium">
        {row.name}
      </TableCell>
      {groups.map((group) =>
        group.kind === 'windows' ? (
          <AccumulationCells
            key={group.windows.join()}
            row={row}
            unit={unit}
            windows={group.windows}
          />
        ) : (
          <MetaCell key={group.column} row={row} unit={unit} column={group.column} />
        ),
      )}
    </TableRow>
  )
}

// One run of 1H..72H sum cells for one station; a station with no observations
// in the widest window collapses the run to a single "missing" cell, like the
// legacy page.
function AccumulationCells({
  row,
  unit,
  windows,
}: {
  row: PrecipAccumulationRow
  unit: Unit
  windows: Window[]
}) {
  if (!row.hasData) {
    return (
      <TableCell colSpan={windows.length} className="px-2 py-1.5 text-center text-muted-foreground">
        missing
      </TableCell>
    )
  }
  return windows.map((hours) => {
    const value = row.totals[hours]
    return (
      <TableCell
        key={hours}
        className={cn('px-2 py-1.5 text-right', value == null && 'text-muted-foreground')}
      >
        {value == null ? '–' : formatTotal(value, unit)}
      </TableCell>
    )
  })
}

const META_HEADS: Record<
  MetaColumn,
  { label: string; sublabel: (unit: Unit, tz: string) => string | undefined }
> = {
  lastUpdate: { label: 'Last update', sublabel: (_, tz) => tz || undefined },
  latitude: { label: 'Latitude', sublabel: () => '°N' },
  longitude: { label: 'Longitude', sublabel: () => '°W' },
  elevation: { label: 'Elevation', sublabel: (unit) => ELEVATION_UNIT[unit] },
}

function HeaderRow({
  sort,
  onSort,
  unit,
  timezoneLabel,
  columns,
}: {
  sort: SortState | null
  onSort: (key: SortKey) => void
  unit: Unit
  timezoneLabel: string
  columns: PrecipColumn[]
}) {
  const stateFor = (key: SortKey): HeadSortState => ({
    active: sort?.key === key,
    desc: sort?.key === key ? sort.desc : false,
    onClick: () => onSort(key),
  })
  return (
    <TableRow>
      <SortableHead label="Station" state={stateFor('name')} sticky />
      {columns.map((column) => {
        const hours = toWindow(column)
        if (hours !== undefined) {
          return (
            <SortableHead
              key={column}
              label={`${hours}H`}
              sublabel={PRECIP_UNIT[unit]}
              state={stateFor(hours)}
            />
          )
        }
        const meta = toMetaColumn(column)
        if (!meta) return null
        const head = META_HEADS[meta]
        return (
          <SortableHead
            key={column}
            label={head.label}
            sublabel={head.sublabel(unit, timezoneLabel)}
            state={stateFor(meta)}
          />
        )
      })}
    </TableRow>
  )
}

// Station x trailing-window precip matrix, matching the legacy
// /data-portal/accumulations/precipitation/ table: 1H..72H sums (in/mm),
// last report, latitude, elevation. Default order is the block's station
// list; clicking a header sorts client-side, toggling direction.
export function PrecipAccumulationTable({
  table,
  columns = ALL_PRECIP_COLUMNS,
}: {
  table: PrecipAccumulationData
  columns?: PrecipColumn[]
}) {
  const groups = useMemo(() => groupColumns(columns), [columns])
  const [sort, setSort] = useState<SortState | null>(null)
  const [unit, setUnit] = useState<Unit>('imperial')

  const onSort = (key: SortKey) =>
    setSort((prev) =>
      prev?.key === key ? { key, desc: !prev.desc } : { key, desc: key !== 'name' },
    )

  const rows = useMemo(
    () => (sort ? [...table.rows].sort((a, b) => compareRows(a, b, sort)) : table.rows),
    [table.rows, sort],
  )

  if (table.rows.length === 0) {
    return (
      <p className="text-muted-foreground">
        No precipitation readings from these stations in the last 72 hours.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <UnitToggle unit={unit} onChange={setUnit} />
      </div>
      <StationTableFrame
        label="Accumulated precipitation by station"
        className="mx-auto w-auto text-base"
      >
        <StationTableHeader>
          <HeaderRow
            sort={sort}
            onSort={onSort}
            unit={unit}
            timezoneLabel={table.timezoneLabel}
            columns={columns}
          />
        </StationTableHeader>
        <TableBody>
          {rows.map((row) => (
            <StationRow key={`${row.source}:${row.stid}`} row={row} unit={unit} groups={groups} />
          ))}
        </TableBody>
      </StationTableFrame>
    </div>
  )
}
