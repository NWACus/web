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
import { ArrowDown, ArrowUp, GripVertical, SlidersHorizontal } from 'lucide-react'
import type { GraphPreset } from './stationGraphPresets'
import type { useChartArrangement } from './useChartArrangement'

const rowButtonClass =
  'rounded-md p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground'

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

type EditViewProps = {
  arrangement: ReturnType<typeof useChartArrangement>
  emptyKeys: ReadonlySet<string>
}

function EditGraphsPanel({ arrangement, emptyKeys }: EditViewProps) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit graphs</DialogTitle>
        <DialogDescription>Show, hide, and drag to reorder graphs.</DialogDescription>
      </DialogHeader>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <GraphList arrangement={arrangement} emptyKeys={emptyKeys} />
      </div>
      <DialogFooter className="sm:justify-between">
        <Button variant="ghost" size="sm" onClick={arrangement.resetArrangement}>
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
        <Button variant="outline" className="gap-2">
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
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-md">
        <EditGraphsPanel {...props} />
      </DialogContent>
    </Dialog>
  )
}
