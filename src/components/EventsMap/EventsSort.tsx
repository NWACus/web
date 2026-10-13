'use client'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { formatNearParam } from '@/utilities/geo/nearParam'
import { cn } from '@/utilities/ui'
import { ArrowUpDown, Check, Loader2, LocateFixed, X } from 'lucide-react'
import { useQueryStates } from 'nuqs'
import { useId, useRef, useState, type RefObject } from 'react'
import { requestDeviceLocation, saveDeviceLocation } from './deviceLocation'
import { PlaceSearch, type PickedPlace } from './PlaceSearch'
import { DEVICE_NEAR, nearParams, useNearOrigin, type NearOrigin } from './useNearOrigin'

// Matches the List/Map toggle's icons.
const ICON_SIZE = '[&_svg]:size-4 [&_svg]:shrink-0'

type Locating = { busy: boolean; error: string | null }

/** "Use my location": asks only on this click, then keeps the answer in the session. */
function useLocateMe(onLocated: () => void, onFailed: () => void) {
  const [state, setState] = useState<Locating>({ busy: false, error: null })
  const locate = () => {
    setState({ busy: true, error: null })
    requestDeviceLocation()
      .then((point) => {
        saveDeviceLocation(point)
        setState({ busy: false, error: null })
        onLocated()
      })
      .catch((error: Error) => {
        setState({ busy: false, error: error.message })
        onFailed()
      })
  }
  return { ...state, locate }
}

function SortOption({
  checked,
  onClick,
  children,
}: {
  checked: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent"
    >
      <Check className={cn('h-4 w-4', !checked && 'invisible')} />
      {children}
    </button>
  )
}

function UseMyLocationButton({ locating }: { locating: ReturnType<typeof useLocateMe> }) {
  return (
    <>
      <Button
        variant="link"
        size="clear"
        className={cn('items-center gap-2 py-1', ICON_SIZE)}
        disabled={locating.busy}
        onClick={locating.locate}
      >
        {locating.busy ? <Loader2 className="animate-spin" /> : <LocateFixed />}
        {locating.busy ? 'Finding your location…' : 'Use my location'}
      </Button>
      {locating.error && (
        <p role="alert" className="text-sm text-destructive">
          {locating.error}
        </p>
      )}
    </>
  )
}

function ClearSortButton({ shown, onClick }: { shown: boolean; onClick: () => void }) {
  if (!shown) return null
  return (
    <Button
      variant="ghost"
      size="sm"
      className={ICON_SIZE}
      aria-label="Sort soonest first instead"
      onClick={onClick}
    >
      <X />
    </Button>
  )
}

function SortTrigger({ origin }: { origin: NearOrigin | null }) {
  return (
    <PopoverTrigger asChild>
      <Button variant="outline" size="sm" className={cn('min-w-0 gap-2', ICON_SIZE)}>
        <ArrowUpDown />
        <span className="truncate">{origin ? `Nearest to ${origin.label}` : 'Soonest first'}</span>
      </Button>
    </PopoverTrigger>
  )
}

function NearestOptions({
  placeInputRef,
  onPickPlace,
  locating,
}: {
  placeInputRef: RefObject<HTMLInputElement | null>
  onPickPlace: (place: PickedPlace) => void
  locating: ReturnType<typeof useLocateMe>
}) {
  return (
    <>
      <div className="px-2 pt-3 pb-1 text-sm text-muted-foreground">Nearest to…</div>
      <div className="flex flex-col gap-2 px-2 pb-1">
        <PlaceSearch inputRef={placeInputRef} onPick={onPickPlace} />
        <UseMyLocationButton locating={locating} />
      </div>
    </>
  )
}

/** Soonest first, or nearest to a typed place or the device location. */
export function EventsSort() {
  const [, setNear] = useQueryStates(nearParams)
  const origin = useNearOrigin()
  const [open, setOpen] = useState(false)
  const placeInputRef = useRef<HTMLInputElement>(null)
  const titleId = useId()
  const sortBy = (near: string | null, nearLabel: string | null) => {
    setNear({ near, nearLabel })
    setOpen(false)
  }
  const locating = useLocateMe(
    () => sortBy(DEVICE_NEAR, null),
    () => placeInputRef.current?.focus(),
  )
  const sortSoonest = () => sortBy(null, null)
  const sortNearPlace = ({ label, point }: PickedPlace) => sortBy(formatNearParam(point), label)

  return (
    <div className="flex min-w-0 items-center gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <SortTrigger origin={origin} />
        <PopoverContent align="start" aria-labelledby={titleId} className="w-80 p-2">
          <h2 id={titleId} className="px-2 pt-1 pb-2 font-semibold">
            Sort events
          </h2>
          <SortOption checked={!origin} onClick={sortSoonest}>
            Soonest first
          </SortOption>
          <NearestOptions
            placeInputRef={placeInputRef}
            onPickPlace={sortNearPlace}
            locating={locating}
          />
        </PopoverContent>
      </Popover>
      <ClearSortButton shown={origin !== null} onClick={sortSoonest} />
    </div>
  )
}
