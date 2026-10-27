'use client'

/**
 * The widget's filter modal: the applied filters as tags, the observer filter, and the showing
 * tab's own filters, with "Reset All" and a "View N Results" button whose count follows the
 * filters live — the list behind the sheet refetches as they change.
 */
import { Loader2, SlidersHorizontal } from 'lucide-react'

import { Button } from '@/components/ui/button'
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
import type { ObservationKind, ObservationZoneOption } from '@/services/nac/model/observation'
import type { FilterTag, ObservationFilters } from '@/services/nac/observations/filters'

import { AvalancheGroups, ObservationGroups, ObserverGroup, type GroupProps } from './FilterGroups'
import { FilterTags } from './FilterTags'

interface FilterSheetProps {
  kind: ObservationKind
  filters: ObservationFilters
  today: string
  zones: ObservationZoneOption[]
  centerLabel: string
  activeCount: number
  /** The count the list would show, or null while it loads. */
  resultCount: number | null
  onChange: (patch: Partial<ObservationFilters>) => void
  onRemoveTag: (tag: FilterTag) => void
  onResetAll: () => void
}

function ActiveCount({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span className="ml-1 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
      {count}
      <span className="sr-only"> active</span>
    </span>
  )
}

function ResultsLabel({ count }: { count: number | null }) {
  if (count === null)
    return <Loader2 className="h-4 w-4 animate-spin" aria-label="Counting results" />
  return <>{`View ${count} ${count === 1 ? 'Result' : 'Results'}`}</>
}

function TabGroups({ kind, ...props }: GroupProps & { kind: ObservationKind }) {
  return kind === 'observation' ? <ObservationGroups {...props} /> : <AvalancheGroups {...props} />
}

function SheetTrigger({ activeCount }: { activeCount: number }) {
  return (
    <DialogTrigger asChild>
      <Button type="button" variant="outline" size="sm" className="relative h-9 gap-1">
        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
        Filters
        <ActiveCount count={activeCount} />
      </Button>
    </DialogTrigger>
  )
}

function SheetHeading({ kind }: { kind: ObservationKind }) {
  return (
    <DialogHeader>
      <DialogTitle>Filters</DialogTitle>
      <DialogDescription className="sr-only">
        Narrow the {kind === 'observation' ? 'observations' : 'avalanches'} listed and mapped.
      </DialogDescription>
    </DialogHeader>
  )
}

function SheetFooter({
  resultCount,
  onResetAll,
}: Pick<FilterSheetProps, 'resultCount' | 'onResetAll'>) {
  return (
    <DialogFooter className="flex-row justify-between gap-2 sm:justify-between">
      <Button type="button" variant="outline" onClick={onResetAll}>
        Reset All
      </Button>
      <DialogClose asChild>
        <Button type="button" className="min-w-40">
          <ResultsLabel count={resultCount} />
        </Button>
      </DialogClose>
    </DialogFooter>
  )
}

export function FilterSheet(props: FilterSheetProps) {
  const { kind, filters, onChange } = props
  return (
    <Dialog>
      <SheetTrigger activeCount={props.activeCount} />
      <DialogContent className="flex max-h-[90dvh] flex-col gap-4 sm:max-w-lg">
        <SheetHeading kind={kind} />
        <FilterTags
          kind={kind}
          filters={filters}
          today={props.today}
          zones={props.zones}
          centerLabel={props.centerLabel}
          onRemove={props.onRemoveTag}
        />
        <div className="flex min-h-0 flex-col gap-5 overflow-y-auto pr-1">
          <ObserverGroup filters={filters} onChange={onChange} />
          <TabGroups kind={kind} filters={filters} onChange={onChange} />
        </div>
        <SheetFooter resultCount={props.resultCount} onResetAll={props.onResetAll} />
      </DialogContent>
    </Dialog>
  )
}
