'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type {
  PrecipAccumulationTable as PrecipAccumulationData,
  PrecipAccumulationRow,
} from '@/services/snowobs/transform'
import { PRECIP_ACCUMULATION_WINDOWS } from '@/services/snowobs/transform'
import { cn } from '@/utilities/ui'
import { ChevronDown, ChevronsUpDown, ChevronUp } from 'lucide-react'
import { useMemo, useState } from 'react'

// Totals come from the API in inches; mm is a display conversion.
type Unit = 'in' | 'mm'
function formatTotal(value: number, unit: Unit): string {
  return unit === 'mm' ? (value * 25.4).toFixed(1) : value.toFixed(2)
}

// Sortable columns: station name, each trailing window (by hours), and the
// metadata columns. Numbers default to descending, name to ascending.
type SortKey = 'name' | 'lastUpdate' | 'latitude' | 'elevation' | number
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

function formatElevation(row: PrecipAccumulationRow): string {
  return row.elevation != null ? `${row.elevation}'` : '–'
}

function StationRow({ row, unit }: { row: PrecipAccumulationRow; unit: Unit }) {
  const noReport = !row.lastUpdate
  return (
    <TableRow className="bg-background even:bg-muted">
      <TableCell className="sticky left-0 z-10 whitespace-nowrap bg-inherit px-2 py-1.5 font-medium">
        {row.name}
      </TableCell>
      <AccumulationCells row={row} unit={unit} />
      <TableCell
        className={cn(
          'whitespace-nowrap px-2 py-1.5 text-right font-light',
          noReport && 'text-muted-foreground',
        )}
      >
        {noReport ? 'no report in 72H' : row.lastUpdate}
      </TableCell>
      <TableCell className="px-2 py-1.5 text-right font-light">{formatLatitude(row)}</TableCell>
      <TableCell className="px-2 py-1.5 text-right font-light">{formatElevation(row)}</TableCell>
    </TableRow>
  )
}

// The 1H..72H sum cells for one station; a station with no observations in the
// widest window collapses to a single "missing" cell, like the legacy page.
function AccumulationCells({ row, unit }: { row: PrecipAccumulationRow; unit: Unit }) {
  if (!row.hasData) {
    return (
      <TableCell
        colSpan={PRECIP_ACCUMULATION_WINDOWS.length}
        className="px-2 py-1.5 text-center font-light text-muted-foreground"
      >
        missing
      </TableCell>
    )
  }
  return PRECIP_ACCUMULATION_WINDOWS.map((hours) => {
    const value = row.totals[hours]
    return (
      <TableCell
        key={hours}
        className={cn(
          'px-2 py-1.5 text-right font-light',
          value == null && 'text-muted-foreground',
        )}
      >
        {value == null ? '–' : formatTotal(value, unit)}
      </TableCell>
    )
  })
}

function UnitToggle({ unit, onChange }: { unit: Unit; onChange: (u: Unit) => void }) {
  return (
    <div className="mb-2 flex justify-end">
      <ToggleGroup
        type="single"
        size="sm"
        variant="outline"
        value={unit}
        onValueChange={(v) => v && onChange(v as Unit)}
        aria-label="Precipitation units"
      >
        <ToggleGroupItem value="in">in</ToggleGroupItem>
        <ToggleGroupItem value="mm">mm</ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
}

function HeaderRow({
  sort,
  onSort,
  unit,
  timezoneLabel,
}: {
  sort: SortState | null
  onSort: (key: SortKey) => void
  unit: Unit
  timezoneLabel: string
}) {
  const lastUpdateLabel = timezoneLabel ? `Last update (${timezoneLabel})` : 'Last update'
  const stateFor = (key: SortKey): HeadSortState => ({
    active: sort?.key === key,
    desc: sort?.key === key ? sort.desc : false,
    onClick: () => onSort(key),
  })
  return (
    <TableRow>
      <SortableHead label="Station" state={stateFor('name')} sticky />
      {PRECIP_ACCUMULATION_WINDOWS.map((hours) => (
        <SortableHead key={hours} label={`${hours}H`} sublabel={unit} state={stateFor(hours)} />
      ))}
      <SortableHead label={lastUpdateLabel} state={stateFor('lastUpdate')} />
      <SortableHead label="Latitude" state={stateFor('latitude')} />
      <SortableHead label="Elevation" state={stateFor('elevation')} />
    </TableRow>
  )
}

// Station x trailing-window precip matrix, matching the legacy
// /data-portal/accumulations/precipitation/ table: 1H..72H sums (in/mm),
// last report, latitude, elevation. Default order (north -> south) comes from
// the server; clicking a header sorts client-side, toggling direction.
export function PrecipAccumulationTable({ table }: { table: PrecipAccumulationData }) {
  const [sort, setSort] = useState<SortState | null>(null)
  const [unit, setUnit] = useState<Unit>('in')

  const onSort = (key: SortKey) =>
    setSort((prev) =>
      prev?.key === key ? { key, desc: !prev.desc } : { key, desc: key !== 'name' },
    )

  const rows = useMemo(
    () => (sort ? [...table.rows].sort((a, b) => compareRows(a, b, sort)) : table.rows),
    [table.rows, sort],
  )

  if (table.rows.length === 0) {
    return <p className="text-muted-foreground">No station observations in the last 72 hours.</p>
  }

  return (
    <div>
      <UnitToggle unit={unit} onChange={setUnit} />
      <Table className="mx-auto w-auto text-base">
        <TableHeader>
          <HeaderRow sort={sort} onSort={onSort} unit={unit} timezoneLabel={table.timezoneLabel} />
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <StationRow key={row.stid} row={row} unit={unit} />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
