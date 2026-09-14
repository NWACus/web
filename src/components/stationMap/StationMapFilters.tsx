'use client'

/**
 * The filter bar above the map: the widget's toolbar, filter tags and mobile filter sheet.
 *
 * Desktop shows one dropdown per filter in the widget's order — settings (units), marker label,
 * recency, zone, type — then the station search, then the link to the table view. Below `lg` the
 * same groups stack inside the bottom drawer the events, blog and courses pages use. Active
 * filters show as removable chips under the bar with a reset.
 */
import { ChevronDown, RefreshCw, Settings, Table2, X } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { useState } from 'react'

import { MobileFiltersDrawer } from '@/components/filters/MobileFiltersDrawer'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  SHOW_ALL_VARIABLE,
  SHOW_ALL_WITHIN,
  WITHIN_OPTIONS,
  isFilterActive,
  type StationMapFilters as Filters,
  type MapPoint,
} from '@/services/snowobs/stationMap/filters'
import { sourceLabel } from '@/services/snowobs/stationMap/format'
import type { StationMapVariable } from '@/services/snowobs/stationMap/model'

import {
  RecencyOptions,
  TypeOptions,
  UnitOptions,
  VariableOptions,
  ZoneOptions,
  type OptionGroupProps,
} from './FilterOptions'
import { StationSearch } from './StationSearch'

/** What the map will show once the drawer closes. */
export interface VisibleCounts {
  stations: number
  webcams: number
}

/**
 * What the drawer's apply button counts: stations alone when only they are on the map — which is
 * every center without webcams, and any filter that hides them.
 */
function visibleLabel({ stations, webcams }: VisibleCounts): string {
  if (webcams === 0) return 'stations'
  if (stations === 0) return 'webcams'
  return 'stations & webcams'
}

export interface StationMapFiltersProps {
  filters: Filters
  onChange: (patch: Partial<Filters>) => void
  onReset: () => void
  variables: StationMapVariable[]
  zoneNames: string[]
  visibleCounts: VisibleCounts
  searchPoints: MapPoint[]
  onSearchSelect: (point: MapPoint) => void
  /** The table view to link to, when this center has one. */
  tableHref: string | null
}

interface FilterGroup {
  key: string
  label: string
  icon?: ReactNode
  node: ReactNode
}

/** The option groups in the widget's order. The zone group only appears when there's a real choice. */
function filterGroups(
  groupProps: OptionGroupProps,
  variables: StationMapVariable[],
  zoneNames: string[],
): FilterGroup[] {
  const groups: FilterGroup[] = [
    {
      key: 'units',
      label: '',
      icon: <Settings className="h-4 w-4" aria-label="Settings" />,
      node: <UnitOptions {...groupProps} />,
    },
    {
      key: 'variable',
      label: 'Station Labels',
      node: <VariableOptions {...groupProps} variables={variables} />,
    },
    { key: 'recency', label: 'Last Updated', node: <RecencyOptions {...groupProps} /> },
  ]
  if (zoneNames.length > 2) {
    groups.push({
      key: 'zone',
      label: 'Zone',
      node: <ZoneOptions {...groupProps} zoneNames={zoneNames} />,
    })
  }
  groups.push({ key: 'type', label: 'Type', node: <TypeOptions {...groupProps} /> })
  return groups
}

function FilterMenu({ group }: { group: FilterGroup }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-1">
          {group.icon}
          {group.label}
          <ChevronDown className="h-3 w-3" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto min-w-48 p-3">
        {group.node}
      </PopoverContent>
    </Popover>
  )
}

// --- Chips -------------------------------------------------------------------------------------

interface ChipSpec {
  key: string
  label: string
  remove: Partial<Filters>
}

function sourceChip(filters: Filters): ChipSpec[] {
  if (!filters.source) return []
  return [
    { key: 'source', label: sourceLabel(filters.source).toLowerCase(), remove: { source: null } },
  ]
}

function variableChip(filters: Filters, variables: StationMapVariable[]): ChipSpec[] {
  if (filters.variable === SHOW_ALL_VARIABLE) return []
  const name = variables.find((v) => v.variable === filters.variable)?.longName ?? filters.variable
  return [{ key: 'variable', label: name, remove: { variable: SHOW_ALL_VARIABLE } }]
}

function recencyChip(filters: Filters): ChipSpec[] {
  if (filters.withinMinutes === SHOW_ALL_WITHIN) return []
  const option = WITHIN_OPTIONS.find((candidate) => candidate.value === filters.withinMinutes)
  const within = option?.label ?? String(filters.withinMinutes)
  return [{ key: 'within', label: `Within ${within}`, remove: { withinMinutes: SHOW_ALL_WITHIN } }]
}

function zoneChips(filters: Filters): ChipSpec[] {
  return filters.zones.map((zone) => ({
    key: `zone-${zone}`,
    label: zone,
    remove: { zones: filters.zones.filter((z) => z !== zone) },
  }))
}

function typeChip(filters: Filters): ChipSpec[] {
  return filters.type ? [{ key: 'type', label: filters.type, remove: { type: null } }] : []
}

/** One chip per active filter, in the widget's order. */
function activeChips(filters: Filters, variables: StationMapVariable[]): ChipSpec[] {
  return [
    ...sourceChip(filters),
    ...variableChip(filters, variables),
    ...recencyChip(filters),
    ...zoneChips(filters),
    ...typeChip(filters),
  ]
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border bg-muted px-2 py-0.5 text-xs capitalize">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="text-muted-foreground hover:text-foreground"
      >
        <X className="h-3 w-3" aria-hidden="true" />
        <span className="sr-only">Remove {label} filter</span>
      </button>
    </span>
  )
}

function FilterChips({
  filters,
  onChange,
  onReset,
  variables,
}: OptionGroupProps & { onReset: () => void; variables: StationMapVariable[] }) {
  if (!isFilterActive(filters)) return null

  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b pb-2">
      {activeChips(filters, variables).map((chip) => (
        <Chip key={chip.key} label={chip.label} onRemove={() => onChange(chip.remove)} />
      ))}
      <Button
        type="button"
        variant="link"
        size="sm"
        // The link variant top-aligns its content; the chips beside it are centered.
        className="h-6 items-center gap-1 px-1 text-xs"
        onClick={onReset}
      >
        <RefreshCw className="h-3 w-3" aria-hidden="true" />
        Reset
      </Button>
    </div>
  )
}

// --- The bar -------------------------------------------------------------------------------------

function MobileFilterSheet({
  groups,
  chips,
  search,
  visibleCounts,
  hasActiveFilters,
}: {
  groups: FilterGroup[]
  chips: ReactNode
  search: (onPicked: () => void) => ReactNode
  visibleCounts: VisibleCounts
  hasActiveFilters: boolean
}) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <div className="flex-1 lg:hidden">
      <MobileFiltersDrawer
        docLabel={visibleLabel(visibleCounts)}
        docCount={visibleCounts.stations + visibleCounts.webcams}
        hasActiveFilters={hasActiveFilters}
        open={open}
        onOpenChange={setOpen}
      >
        <div className="flex flex-col gap-4 py-4">
          {search(close)}
          {chips}
          {groups.map((group) => (
            <div key={group.key}>{group.node}</div>
          ))}
        </div>
      </MobileFiltersDrawer>
    </div>
  )
}

function DesktopFilterBar({
  groups,
  searchPoints,
  onSearchSelect,
}: {
  groups: FilterGroup[]
  searchPoints: MapPoint[]
  onSearchSelect: (point: MapPoint) => void
}) {
  return (
    <div className="hidden flex-wrap items-center gap-2 lg:flex">
      {groups.map((group) => (
        <FilterMenu key={group.key} group={group} />
      ))}
      <StationSearch points={searchPoints} onSelect={onSearchSelect} className="w-64" />
    </div>
  )
}

function TableLink({ href }: { href: string }) {
  return (
    // Level with the drawer's trigger below `lg` and with the dropdowns above it.
    <Button asChild variant="outline" size="sm" className="h-10 gap-1 lg:h-9">
      <Link href={href}>
        <Table2 className="h-4 w-4" aria-hidden="true" />
        Table
      </Link>
    </Button>
  )
}

export function StationMapFilters({
  filters,
  onChange,
  onReset,
  variables,
  zoneNames,
  visibleCounts,
  searchPoints,
  onSearchSelect,
  tableHref,
}: StationMapFiltersProps) {
  const groups = filterGroups({ filters, onChange }, variables, zoneNames)
  const chips = (
    <FilterChips filters={filters} onChange={onChange} onReset={onReset} variables={variables} />
  )
  const sheetSearch = (onPicked: () => void) => (
    <StationSearch
      points={searchPoints}
      onSelect={(point) => {
        onSearchSelect(point)
        onPicked()
      }}
    />
  )

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2 border-b border-t py-2">
        <DesktopFilterBar
          groups={groups}
          searchPoints={searchPoints}
          onSearchSelect={onSearchSelect}
        />
        <MobileFilterSheet
          groups={groups}
          chips={chips}
          visibleCounts={visibleCounts}
          hasActiveFilters={isFilterActive(filters)}
          search={sheetSearch}
        />
        {tableHref && <TableLink href={tableHref} />}
      </div>
      {chips}
    </div>
  )
}
