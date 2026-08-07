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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import type { GraphPreset } from './stationGraphPresets'
import type { StationPeriod } from './stationPeriods'
import { DEFAULT_GRAPH_PERIOD, GRAPH_PERIODS } from './stationPeriods'
import { StationSelectGroups, stationSelectTriggerClass } from './StationPicker'
import { UnitToggle } from './UnitToggle'
import type { useChartArrangement } from './useChartArrangement'

const rowButtonClass =
  'rounded-md p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground'

const sectionLabelClass = 'text-sm font-medium'

export const chipClass = 'inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-sm'

export function PeriodSelect({
  active,
  onChange,
  className,
}: {
  active: StationPeriod
  onChange: (period: StationPeriod) => void
  className?: string
}) {
  return (
    <Select
      value={active.key}
      onValueChange={(key) =>
        onChange(GRAPH_PERIODS.find((p) => p.key === key) ?? DEFAULT_GRAPH_PERIOD)
      }
    >
      <SelectTrigger
        aria-label="Date range"
        className={cn(stationSelectTriggerClass, 'py-1.5', className)}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="item-aligned">
        {GRAPH_PERIODS.map((period) => (
          <SelectItem key={period.key} value={period.key}>
            {period.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function CompareSelect({
  currentSlug,
  compareSlugs,
  onCompareChange,
  className,
}: {
  currentSlug: string
  compareSlugs: string[]
  onCompareChange: (slugs: string[]) => void
  className?: string
}) {
  const atCap = compareSlugs.length >= MAX_COMPARE_STATIONS
  return (
    <Select
      value=""
      disabled={atCap}
      onValueChange={(slug) => onCompareChange([...compareSlugs, slug])}
    >
      <SelectTrigger
        aria-label="Compare with"
        className={cn(stationSelectTriggerClass, 'py-1.5', className)}
      >
        <SelectValue
          placeholder={atCap ? `Up to ${MAX_COMPARE_STATIONS} stations` : 'Add a station…'}
        />
      </SelectTrigger>
      <SelectContent position="item-aligned">
        <StationSelectGroups excludeSlugs={[currentSlug, ...compareSlugs]} />
      </SelectContent>
    </Select>
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

// The toolbar controls, repeated inside the dialog for small screens where
// the toolbar shows only the Edit graphs button.
function MobileViewControls(props: EditViewProps) {
  return (
    <div className="flex flex-col gap-4 sm:hidden">
      <div className="flex items-center justify-between gap-3">
        <span className={sectionLabelClass}>Date range</span>
        <PeriodSelect active={props.graphPeriod} onChange={props.onPeriodChange} />
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className={sectionLabelClass}>Units</span>
        <UnitToggle unit={props.unitSystem} onChange={props.onUnitChange} />
      </div>
      <div className="flex flex-col gap-2">
        <span className={sectionLabelClass}>Compare stations</span>
        <CompareSelect
          currentSlug={props.currentSlug}
          compareSlugs={props.compareSlugs}
          onCompareChange={props.onCompareChange}
          className="w-full"
        />
        {props.compareSlugs.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <CompareChips
              compareSlugs={props.compareSlugs}
              onRemove={(slug) =>
                props.onCompareChange(props.compareSlugs.filter((s) => s !== slug))
              }
            />
          </div>
        )}
      </div>
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
        <ul>
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

function EditGraphsPanel(props: EditViewProps) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit graphs</DialogTitle>
        <DialogDescription>Show, hide, and drag to reorder graphs.</DialogDescription>
      </DialogHeader>
      <MobileViewControls {...props} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <span className={cn(sectionLabelClass, 'sm:hidden')}>Graphs</span>
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
  const hiddenCount = props.arrangement.hiddenPresets.length
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full gap-2 sm:w-auto">
          <SlidersHorizontal className="h-4 w-4" />
          Edit graphs
          {hiddenCount > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-2 text-xs text-primary-foreground">
              {hiddenCount}
              <span className="sr-only"> hidden</span>
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[85dvh] flex-col sm:max-w-md">
        <EditGraphsPanel {...props} />
      </DialogContent>
    </Dialog>
  )
}
