'use client'

/**
 * The filter bar above the map: the widget's toolbar, filter tags and mobile filter sheet.
 *
 * Desktop shows one dropdown per filter in the widget's order — settings (color rules, units),
 * marker label, recency, zone, type — then the station search, then the button that swaps the map
 * for the table and back. Below `lg` the same groups stack inside the bottom drawer the events,
 * blog and courses pages use. Active filters show as removable chips under the bar with a reset.
 */
import { ChevronDown, Map as MapIcon, RefreshCw, Settings, Table2, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'

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
  ColorRuleOptions,
  RecencyOptions,
  TypeOptions,
  UnitOptions,
  VariableOptions,
  ZoneOptions,
  type ColorRulesToggle,
  type OptionGroupProps,
} from './FilterOptions'
import { StationSearch } from './StationSearch'
import type { StationMapDisplay } from './stationMapUrl'

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
  onSearchClear?: () => void
  /** The table has a sort or a picked-out row to undo, so Reset is offered without a filter set. */
  tableChanged?: boolean
  display: StationMapDisplay
  onDisplayChange: (display: StationMapDisplay) => void
  /** The reader just switched views: the switch they pressed was replaced, so focus its successor. */
  focusDisplayToggle?: boolean
  /** Offered only where the center has color rules and the readings are in their units. */
  colorRules: ColorRulesToggle | null
}

interface FilterGroup {
  key: string
  label: string
  icon?: ReactNode
  node: ReactNode
}

function SettingsOptions({
  groupProps,
  colorRules,
}: {
  groupProps: OptionGroupProps
  colorRules: ColorRulesToggle | null
}) {
  if (!colorRules) return <UnitOptions {...groupProps} />
  return (
    <div className="flex flex-col gap-3">
      <ColorRuleOptions {...colorRules} />
      <UnitOptions {...groupProps} />
    </div>
  )
}

/** The option groups in the widget's order. The zone group only appears when there's a real choice. */
function filterGroups(
  groupProps: OptionGroupProps,
  variables: StationMapVariable[],
  zoneNames: string[],
  colorRules: ColorRulesToggle | null,
): FilterGroup[] {
  const groups: FilterGroup[] = [
    {
      key: 'units',
      label: '',
      icon: <Settings className="h-4 w-4" aria-label="Settings" />,
      node: <SettingsOptions groupProps={groupProps} colorRules={colorRules} />,
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
  tableChanged,
}: OptionGroupProps & {
  onReset: () => void
  variables: StationMapVariable[]
  tableChanged: boolean
}) {
  if (!isFilterActive(filters) && !tableChanged) return null

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

function DesktopFilterBar({ groups, search }: { groups: FilterGroup[]; search: ReactNode }) {
  return (
    <div className="hidden flex-wrap items-center gap-2 lg:flex">
      {groups.map((group) => (
        <FilterMenu key={group.key} group={group} />
      ))}
      {search}
    </div>
  )
}

/** The widget's one button that swaps the map for the table, and the table back for the map. */
function DisplayToggle({
  display,
  onChange,
  focusOnMount,
}: {
  display: StationMapDisplay
  onChange: (display: StationMapDisplay) => void
  focusOnMount: boolean
}) {
  const ref = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (focusOnMount) ref.current?.focus()
    // On mount only: the toolbar is remounted with each view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const toTable = display === 'map'
  const Icon = toTable ? Table2 : MapIcon
  return (
    // Level with the drawer's trigger below `lg` and with the dropdowns above it.
    <Button
      ref={ref}
      type="button"
      variant="outline"
      size="sm"
      className="h-10 gap-1 lg:h-9"
      onClick={() => onChange(toTable ? 'table' : 'map')}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {toTable ? 'Table' : 'Map'}
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
  onSearchClear,
  tableChanged = false,
  display,
  onDisplayChange,
  focusDisplayToggle = false,
  colorRules,
}: StationMapFiltersProps) {
  const groups = filterGroups({ filters, onChange }, variables, zoneNames, colorRules)
  const chips = (
    <FilterChips
      filters={filters}
      onChange={onChange}
      onReset={onReset}
      variables={variables}
      tableChanged={tableChanged}
    />
  )
  const sheetSearch = (onPicked: () => void) => (
    <StationSearch
      points={searchPoints}
      onSelect={(point) => {
        onSearchSelect(point)
        onPicked()
      }}
      onClear={onSearchClear}
    />
  )

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2 border-b border-t py-2">
        <DesktopFilterBar
          groups={groups}
          search={
            <StationSearch
              points={searchPoints}
              onSelect={onSearchSelect}
              onClear={onSearchClear}
              className="w-64"
            />
          }
        />
        <MobileFilterSheet
          groups={groups}
          chips={chips}
          visibleCounts={visibleCounts}
          hasActiveFilters={isFilterActive(filters)}
          search={sheetSearch}
        />
        <DisplayToggle
          display={display}
          onChange={onDisplayChange}
          focusOnMount={focusDisplayToggle}
        />
      </div>
      {chips}
    </div>
  )
}
