'use client'

import type { AddressParts, GeocodeResult } from '@/services/geocodio'
import { Button, FieldDescription, FieldLabel, toast, useField } from '@payloadcms/ui'
import dynamic from 'next/dynamic'
import type { UIFieldClientComponent } from 'payload'
import { useMemo, useState } from 'react'
import type { GeocodeStatus } from '../coordinatesField'

// mapbox-gl touches `window` when imported, so the map only loads in the browser.
const PickerMap = dynamic(() => import('./PickerMap.client').then((mod) => mod.PickerMap), {
  ssr: false,
  loading: () => (
    <div className="h-72 w-full rounded-[var(--style-radius-s)] bg-[var(--theme-elevation-50)]" />
  ),
})

const STATUS_TEXT: Record<GeocodeStatus, string> = {
  geocoded: 'Placed from the address. Drag the pin if it is off.',
  approximate:
    'Approximate: the address only matched a street, city or ZIP. Drag the pin to the exact spot.',
  manual: 'Placed by hand. Saving won’t move it unless the address changes.',
  failed: 'The address couldn’t be found. Click the map to place the pin.',
}

const LOOKUP_FAILURE: Record<'no-match' | 'unavailable', string> = {
  'no-match': 'No match for that address. Add a city and state or a ZIP, or click the map.',
  unavailable: 'Address lookup is unavailable right now. Click the map to place the pin.',
}

function announce(result: GeocodeResult) {
  if (result.status !== 'found') return toast.error(LOOKUP_FAILURE[result.status])
  if (result.precision === 'exact') return toast.success('Placed the pin at the address.')
  toast.warning('Only an approximate match (street, city or ZIP). Drag the pin to the exact spot.')
}

/** `a.b.c` → `a.b`; a top-level path has no parent. */
const parentOf = (path: string) => path.slice(0, Math.max(path.lastIndexOf('.'), 0))
const join = (parent: string, name: string) => (parent ? `${parent}.${name}` : name)

// Six decimals is about 10 cm, more than enough for a meeting spot.
const round = (value: number) => Math.round(value * 1e6) / 1e6

type Point = { latitude: number; longitude: number }

const pointFrom = (latitude: unknown, longitude: unknown): Point | null =>
  typeof latitude === 'number' && typeof longitude === 'number' ? { latitude, longitude } : null

async function requestGeocode(parts: AddressParts): Promise<GeocodeResult> {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(parts)) {
    if (value) params.set(key, value)
  }
  try {
    const response = await fetch(`/api/events/geocode?${params}`, { credentials: 'include' })
    return await response.json()
  } catch {
    return { status: 'unavailable', reason: 'request failed' }
  }
}

function describeStatus(status: GeocodeStatus | null, placed: boolean) {
  if (status) return STATUS_TEXT[status]
  return placed
    ? 'Drag the pin or click the map to adjust.'
    : 'Saving places the pin from the address. You can also click the map.'
}

export const CoordinatesPicker: UIFieldClientComponent = ({ path }) => {
  // The picker lives in the `coordinates` group, which sits in the location group with the address.
  const coordinates = parentOf(path)
  const location = parentOf(coordinates)

  const latitude = useField<number | null>({ path: join(coordinates, 'latitude') })
  const longitude = useField<number | null>({ path: join(coordinates, 'longitude') })
  const status = useField<GeocodeStatus | null>({ path: join(coordinates, 'geocodeStatus') })
  const address = useField<string>({ path: join(location, 'address') })
  const city = useField<string>({ path: join(location, 'city') })
  const state = useField<string>({ path: join(location, 'state') })
  const zip = useField<string>({ path: join(location, 'zip') })

  const [finding, setFinding] = useState(false)
  const [focus, setFocus] = useState<Point | null>(null)

  const point = useMemo(
    () => pointFrom(latitude.value, longitude.value),
    [latitude.value, longitude.value],
  )

  const setPoint = (next: Point, nextStatus: GeocodeStatus) => {
    latitude.setValue(round(next.latitude))
    longitude.setValue(round(next.longitude))
    status.setValue(nextStatus)
  }

  const findFromAddress = async () => {
    setFinding(true)
    const result = await requestGeocode({
      address: address.value,
      city: city.value,
      state: state.value,
      zip: zip.value,
    })
    setFinding(false)
    announce(result)
    if (result.status === 'found') {
      setPoint(result, result.precision === 'exact' ? 'geocoded' : 'approximate')
      setFocus({ latitude: result.latitude, longitude: result.longitude })
    }
  }

  return (
    <div className="field-type flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        <FieldLabel label="Map location" />
        <Button
          buttonStyle="secondary"
          size="small"
          margin={false}
          disabled={finding}
          onClick={findFromAddress}
        >
          {finding ? 'Finding…' : 'Find from address'}
        </Button>
      </div>
      <PickerMap point={point} focus={focus} onPick={(next) => setPoint(next, 'manual')} />
      <FieldDescription path={path} description={describeStatus(status.value, point !== null)} />
    </div>
  )
}
