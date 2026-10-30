'use client'

import { TableBody, TableCell, TableHead, TableRow } from '@/components/ui/table'
import type {
  PrecipAccumulationTable as PrecipAccumulationData,
  PrecipAccumulationRow,
} from '@/services/snowobs/tableHelpers'
import { PRECIP_ACCUMULATION_WINDOWS } from '@/services/snowobs/tableHelpers'
import type { StationUnits } from '@/services/snowobs/units'
import { elevationIn, formatReading } from '@/services/snowobs/units'
import type { PrecipColumn } from '@/services/stations/precipColumns'
import { ALL_PRECIP_COLUMNS } from '@/services/stations/precipColumns'
import { cn } from '@/utilities/ui'
import { ChevronDown, ChevronsUpDown, ChevronUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import { StationTableFrame, StationTableHeader } from './StationTableFrame'
import { UnitToggle } from './UnitToggle'

// Totals come from the API in the chosen system's unit and precision; elevation is always feet.
type Unit = StationUnits
const ELEVATION_UNIT: Record<Unit, string> = { default: 'ft', metric: 'm' }

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
        'whitespace-nowrap px-1.5 text-right align-top sm:px-2',
        sticky && 'sticky left-0 z-10 min-w-28 bg-background text-left',
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
  return elevationIn(unit, row.elevation).toLocaleString()
}

type Window = (typeof PRECIP_ACCUMULATION_WINDOWS)[number]
const META_COLUMNS = ['lastUpdate', 'latitude', 'longitude', 'elevation'] as const
type MetaColumn = (typeof META_COLUMNS)[number]

function toMetaColumn(column: PrecipColumn): MetaColumn | undefined {
  return META_COLUMNS.find((c) => c === column)
}

// Adjacent windows form one run, which collapses to "missing" for a station without data.
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
          'whitespace-nowrap px-1.5 py-1.5 text-right sm:px-2',
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
  return <TableCell className="px-1.5 py-1.5 text-right sm:px-2">{value}</TableCell>
}

function StationRow({
  row,
  unit,
  decimals,
  groups,
}: {
  row: PrecipAccumulationRow
  unit: Unit
  decimals: number
  groups: ColumnGroup[]
}) {
  return (
    <TableRow className="bg-background even:bg-muted">
      {/* Names wrap on a phone so the pinned column leaves room for the totals. */}
      <TableCell className="sticky left-0 z-10 min-w-28 max-w-36 bg-inherit px-1.5 py-1.5 font-medium leading-snug sm:max-w-none sm:whitespace-nowrap sm:px-2">
        {row.name}
      </TableCell>
      {groups.map((group) =>
        group.kind === 'windows' ? (
          <AccumulationCells
            key={group.windows.join()}
            row={row}
            decimals={decimals}
            windows={group.windows}
          />
        ) : (
          <MetaCell key={group.column} row={row} unit={unit} column={group.column} />
        ),
      )}
    </TableRow>
  )
}

// A station with no observations shows "missing" across the run, like the legacy page.
function AccumulationCells({
  row,
  decimals,
  windows,
}: {
  row: PrecipAccumulationRow
  decimals: number
  windows: Window[]
}) {
  if (!row.hasData) {
    return (
      <TableCell
        colSpan={windows.length}
        className="px-1.5 py-1.5 text-center text-muted-foreground sm:px-2"
      >
        missing
      </TableCell>
    )
  }
  return windows.map((hours) => {
    const value = row.totals[hours]
    return (
      <TableCell
        key={hours}
        className={cn('px-1.5 py-1.5 text-right sm:px-2', value == null && 'text-muted-foreground')}
      >
        {value == null ? '–' : formatReading(value, decimals)}
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
  totalsUnit,
  timezoneLabel,
  columns,
}: {
  sort: SortState | null
  onSort: (key: SortKey) => void
  unit: Unit
  totalsUnit: string
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
              sublabel={totalsUnit}
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
  unit,
  onUnitChange,
  columns = ALL_PRECIP_COLUMNS,
}: {
  table: PrecipAccumulationData
  /** The system `table` was fetched in; changing it refetches. */
  unit: Unit
  onUnitChange: (unit: Unit) => void
  columns?: PrecipColumn[]
}) {
  const groups = useMemo(() => groupColumns(columns), [columns])
  const [sort, setSort] = useState<SortState | null>(null)

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
        <UnitToggle unit={unit} onChange={onUnitChange} />
      </div>
      <StationTableFrame
        label="Accumulated precipitation by station"
        className="mx-auto w-auto text-sm sm:text-base"
      >
        <StationTableHeader>
          <HeaderRow
            sort={sort}
            onSort={onSort}
            unit={unit}
            totalsUnit={table.unit}
            timezoneLabel={table.timezoneLabel}
            columns={columns}
          />
        </StationTableHeader>
        <TableBody>
          {rows.map((row) => (
            <StationRow
              key={`${row.source}:${row.stid}`}
              row={row}
              unit={unit}
              decimals={table.decimals}
              groups={groups}
            />
          ))}
        </TableBody>
      </StationTableFrame>
    </div>
  )
}
