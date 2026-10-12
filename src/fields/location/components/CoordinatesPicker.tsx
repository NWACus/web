'use client'

import type { AddressParts, GeocodeResult } from '@/services/geocodio'
import { Button, FieldLabel, useField } from '@payloadcms/ui'
import dynamic from 'next/dynamic'
import type { UIFieldClientComponent } from 'payload'
import { useMemo, useState } from 'react'
import type { GeocodeStatus } from '../coordinatesField'

// mapbox-gl touches `window` when imported, so the map only loads in the browser.
const PickerMap = dynamic(() => import('./PickerMap.client').then((mod) => mod.PickerMap), {
  ssr: false,
  loading: () => <div className="h-72 w-full rounded bg-[var(--theme-elevation-50)]" />,
})

const STATUS_TEXT: Record<GeocodeStatus, string> = {
  geocoded: 'Placed from the address. Drag the pin if it is off.',
  approximate:
    'Approximate: the address only matched a street, city or ZIP. Drag the pin to the exact spot.',
  manual: 'Placed by hand. Saving won’t move it unless the address changes.',
  failed: 'The address couldn’t be found. Click the map to place the pin.',
}

const LOOKUP_FAILURE: Record<'no-match' | 'unavailable', string> = {
  'no-match': 'No match. Add a city and state or ZIP, or click the map.',
  unavailable: 'Address lookup is unavailable right now. Click the map to place the pin.',
}

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

function describeStatus(lookupError: string | null, status: GeocodeStatus | null, placed: boolean) {
  if (lookupError) return lookupError
  if (status) return STATUS_TEXT[status]
  return placed
    ? 'Drag the pin or click the map to adjust.'
    : 'Saving places the pin from the address. You can also click the map.'
}

export const CoordinatesPicker: UIFieldClientComponent = ({ path }) => {
  // The picker sits beside `coordinates` in the location group: drop its own trailing name.
  const group = path.replace(/\.?coordinatesPicker$/, '')
  const prefix = group ? `${group}.` : ''

  const latitude = useField<number | null>({ path: `${prefix}coordinates.latitude` })
  const longitude = useField<number | null>({ path: `${prefix}coordinates.longitude` })
  const status = useField<GeocodeStatus | null>({ path: `${prefix}coordinates.geocodeStatus` })
  const address = useField<string>({ path: `${prefix}address` })
  const city = useField<string>({ path: `${prefix}city` })
  const state = useField<string>({ path: `${prefix}state` })
  const zip = useField<string>({ path: `${prefix}zip` })

  const [finding, setFinding] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)

  const point = useMemo(
    () => pointFrom(latitude.value, longitude.value),
    [latitude.value, longitude.value],
  )

  const setPoint = (next: Point, nextStatus: GeocodeStatus) => {
    latitude.setValue(round(next.latitude))
    longitude.setValue(round(next.longitude))
    status.setValue(nextStatus)
    setLookupError(null)
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
    if (result.status !== 'found') return setLookupError(LOOKUP_FAILURE[result.status])
    setPoint(result, result.precision === 'exact' ? 'geocoded' : 'approximate')
  }

  return (
    <div className="field-type mb-6 flex flex-col gap-2">
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
      <PickerMap point={point} onPick={(next) => setPoint(next, 'manual')} />
      <p className="text-sm text-[var(--theme-elevation-600)]">
        {describeStatus(lookupError, status.value, point !== null)}
      </p>
    </div>
  )
}
