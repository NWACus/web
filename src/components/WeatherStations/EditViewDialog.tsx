'use client'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { getStationGroup, MAX_COMPARE_STATIONS } from '@/constants/weatherStations'
import type { UnitSystem } from '@/services/snowobs/metricUnits'
import { cn } from '@/utilities/ui'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ArrowDown, ArrowUp, GripVertical, SlidersHorizontal, X } from 'lucide-react'
import { ChipGroup } from './ChipGroup'
import type { GraphPreset } from './stationGraphPresets'
import type { StationPeriod } from './stationPeriods'
import { DEFAULT_GRAPH_PERIOD, GRAPH_PERIODS } from './stationPeriods'
import { StationOptGroups, stationSelectClass } from './StationPicker'
import { UnitToggle } from './UnitToggle'
import type { useChartArrangement } from './useChartArrangement'

export const chipClass = 'inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-sm'

const sectionLabelClass = 'text-sm font-medium'

const rowButtonClass =
  'rounded-md p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground'

const GRAPH_PERIOD_CHIPS = GRAPH_PERIODS.map((p) => ({ key: p.key, label: p.label }))

function PeriodSection({
  active,
  onChange,
}: {
  active: StationPeriod
  onChange: (period: StationPeriod) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className={sectionLabelClass}>Date range</span>
      <ChipGroup
        chips={GRAPH_PERIOD_CHIPS}
        activeKey={active.key}
        onSelect={(key) =>
          onChange(GRAPH_PERIODS.find((p) => p.key === key) ?? DEFAULT_GRAPH_PERIOD)
        }
      />
    </div>
  )
}

export function CompareChips({
  compareSlugs,
  onRemove,
}: {
  compareSlugs: string[]
  onRemove: (slug: string) => void
}) {
  const selected = compareSlugs.flatMap((slug) => getStationGroup(slug) ?? [])

  return selected.map((group) => (
    <span key={group.slug} className={chipClass}>
      {group.displayName}
      <button
        type="button"
        aria-label={`Remove ${group.displayName}`}
        onClick={() => onRemove(group.slug)}
        className="text-muted-foreground hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </span>
  ))
}

function CompareSection({
  currentSlug,
  compareSlugs,
  onCompareChange,
}: {
  currentSlug: string
  compareSlugs: string[]
  onCompareChange: (slugs: string[]) => void
}) {
  const atCap = compareSlugs.length >= MAX_COMPARE_STATIONS
  return (
    <div className="flex flex-col gap-2">
      <span className={sectionLabelClass}>Compare stations</span>
      <select
        value=""
        disabled={atCap}
        aria-label="Compare with"
        onChange={(event) => {
          if (event.target.value) onCompareChange([...compareSlugs, event.target.value])
        }}
        className={cn(stationSelectClass, 'px-3 py-1.5 disabled:opacity-50')}
      >
        <option value="">
          {atCap ? `Up to ${MAX_COMPARE_STATIONS} stations` : 'Add a station…'}
        </option>
        <StationOptGroups excludeSlugs={[currentSlug, ...compareSlugs]} />
      </select>
      {compareSlugs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <CompareChips
            compareSlugs={compareSlugs}
            onRemove={(slug) => onCompareChange(compareSlugs.filter((s) => s !== slug))}
          />
        </div>
      )}
    </div>
  )
}

function GraphRow({
  preset,
  empty,
  arrangement,
}: {
  preset: GraphPreset
  empty: boolean
  arrangement: ReturnType<typeof useChartArrangement>
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: preset.key,
    disabled: empty,
  })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'flex items-center gap-2 rounded-md px-1 py-1.5',
        isDragging && 'z-10 bg-muted shadow-sm',
        empty && 'opacity-50',
      )}
    >
      <button
        type="button"
        aria-label={`Drag to reorder ${preset.title}`}
        disabled={empty}
        className={cn(rowButtonClass, !empty && 'cursor-grab active:cursor-grabbing touch-none')}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <Checkbox
        id={`graph-row-${preset.key}`}
        checked={!empty && !arrangement.isHidden(preset.key)}
        disabled={empty}
        onCheckedChange={(checked) =>
          checked ? arrangement.showChart(preset.key) : arrangement.hideChart(preset.key)
        }
      />
      <label
        htmlFor={`graph-row-${preset.key}`}
        className={cn('flex-1 text-sm', empty ? 'cursor-not-allowed' : 'cursor-pointer')}
      >
        {preset.title}
        {empty && <span className="ml-2 text-xs text-muted-foreground">No data</span>}
      </label>
      <button
        type="button"
        aria-label={`Move ${preset.title} up`}
        disabled={empty || !arrangement.canMove(preset.key, -1)}
        onClick={() => arrangement.moveChart(preset.key, -1)}
        className={rowButtonClass}
      >
        <ArrowUp className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label={`Move ${preset.title} down`}
        disabled={empty || !arrangement.canMove(preset.key, 1)}
        onClick={() => arrangement.moveChart(preset.key, 1)}
        className={rowButtonClass}
      >
        <ArrowDown className="h-4 w-4" />
      </button>
    </li>
  )
}

function GraphList({
  arrangement,
  emptyKeys,
}: {
  arrangement: ReturnType<typeof useChartArrangement>
  emptyKeys: ReadonlySet<string>
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) arrangement.reorderChart(String(active.id), String(over.id))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext
        items={arrangement.orderedPresets.map((p) => p.key)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="mt-1">
          {arrangement.orderedPresets.map((preset) => (
            <GraphRow
              key={preset.key}
              preset={preset}
              empty={emptyKeys.has(preset.key)}
              arrangement={arrangement}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}

export type EditViewProps = {
  graphPeriod: StationPeriod
  onPeriodChange: (period: StationPeriod) => void
  unitSystem: UnitSystem
  onUnitChange: (system: UnitSystem) => void
  currentSlug: string
  compareSlugs: string[]
  onCompareChange: (slugs: string[]) => void
  arrangement: ReturnType<typeof useChartArrangement>
  emptyKeys: ReadonlySet<string>
}

function EditViewPanel(props: EditViewProps) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit view</DialogTitle>
        <DialogDescription>
          Choose the date range, units, comparison stations, and graphs shown.
        </DialogDescription>
      </DialogHeader>
      <PeriodSection active={props.graphPeriod} onChange={props.onPeriodChange} />
      <div className="flex items-center justify-between gap-3">
        <span className={sectionLabelClass}>Units</span>
        <UnitToggle unit={props.unitSystem} onChange={props.onUnitChange} />
      </div>
      <CompareSection
        currentSlug={props.currentSlug}
        compareSlugs={props.compareSlugs}
        onCompareChange={props.onCompareChange}
      />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <span className={sectionLabelClass}>Graphs</span>
        <GraphList arrangement={props.arrangement} emptyKeys={props.emptyKeys} />
      </div>
      <DialogFooter className="sm:justify-between">
        <Button variant="ghost" size="sm" onClick={props.arrangement.resetArrangement}>
          Reset to defaults
        </Button>
        <DialogClose asChild>
          <Button size="sm">Done</Button>
        </DialogClose>
      </DialogFooter>
    </>
  )
}

export function EditViewDialog(props: EditViewProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Edit view
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-md">
        <EditViewPanel {...props} />
      </DialogContent>
    </Dialog>
  )
}
