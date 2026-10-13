'use client'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { formatNearParam } from '@/utilities/geo/nearParam'
import { cn } from '@/utilities/ui'
import { ArrowUpDown, Calendar, Check, Loader2, LocateFixed, MapPin, X } from 'lucide-react'
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

/** Marks the sort in effect, at the end of its row. */
function CurrentSortCheck({ shown }: { shown: boolean }) {
  if (!shown) return null
  return <Check aria-hidden className="ml-auto size-4 text-foreground" />
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
      className={cn(
        'flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent',
        ICON_SIZE,
      )}
    >
      <Calendar />
      {children}
      <CurrentSortCheck shown={checked} />
    </button>
  )
}

function locateLabel(busy: boolean, inUse: boolean): string {
  if (busy) return 'Finding your location…'
  return inUse ? 'Using your location' : 'Use my location'
}

function LocateIcon({ busy }: { busy: boolean }) {
  return busy ? <Loader2 className="animate-spin" /> : <LocateFixed />
}

function LocateError({ error }: { error: string | null }) {
  if (!error) return null
  return (
    <p role="alert" className="text-sm text-destructive">
      {error}
    </p>
  )
}

function UseMyLocationButton({
  locating,
  inUse,
}: {
  locating: ReturnType<typeof useLocateMe>
  inUse: boolean
}) {
  return (
    <>
      {/* Clicking again while in use re-reads the location, e.g. after driving somewhere. */}
      <Button
        variant="link"
        size="clear"
        aria-pressed={inUse}
        className={cn(
          'items-center gap-2 py-1',
          ICON_SIZE,
          inUse && 'font-medium text-foreground hover:no-underline',
        )}
        disabled={locating.busy}
        onClick={locating.locate}
      >
        <LocateIcon busy={locating.busy} />
        {locateLabel(locating.busy, inUse)}
        <CurrentSortCheck shown={inUse && !locating.busy} />
      </Button>
      <LocateError error={locating.error} />
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

const TRIGGER_ICONS = { device: LocateFixed, place: MapPin }

function SortTrigger({ origin }: { origin: NearOrigin | null }) {
  const Icon = origin ? TRIGGER_ICONS[origin.source] : ArrowUpDown
  return (
    <PopoverTrigger asChild>
      <Button variant="outline" size="sm" className={cn('min-w-0 gap-2', ICON_SIZE)}>
        <Icon />
        <span className="truncate">{origin ? `Nearest to ${origin.label}` : 'Soonest first'}</span>
      </Button>
    </PopoverTrigger>
  )
}

/** What each "Nearest first" control shows as in use. */
function originInUse(origin: NearOrigin | null) {
  return {
    place: origin?.source === 'place' ? origin.label : '',
    device: origin?.source === 'device',
  }
}

function NearestOptions({
  origin,
  placeInputRef,
  onPickPlace,
  locating,
}: {
  origin: NearOrigin | null
  placeInputRef: RefObject<HTMLInputElement | null>
  onPickPlace: (place: PickedPlace) => void
  locating: ReturnType<typeof useLocateMe>
}) {
  const active = origin !== null
  const inUse = originInUse(origin)
  return (
    <>
      <div className={cn('flex items-center gap-2 px-2 pt-2 pb-1.5 text-sm', ICON_SIZE)}>
        <MapPin />
        Nearest first
        {active && <span className="sr-only">(current sort)</span>}
        <CurrentSortCheck shown={active} />
      </div>
      {/* Indented to the option text, so both controls read as part of "Nearest first". */}
      <div className="flex flex-col gap-2 pr-2 pb-1 pl-8">
        <PlaceSearch inputRef={placeInputRef} currentPlace={inUse.place} onPick={onPickPlace} />
        <UseMyLocationButton locating={locating} inUse={inUse.device} />
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
            origin={origin}
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
