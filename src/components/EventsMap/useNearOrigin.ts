'use client'

import type { LatLng } from '@/utilities/geo/distance'
import { formatNearParam, parseNearParam } from '@/utilities/geo/nearParam'
import { parseAsString, useQueryStates } from 'nuqs'
import { useDeviceLocation } from './deviceLocation'

/**
 * Sorting by distance. `near` is a typed place's point, or `me` for the device location, which
 * stays in session storage so it never reaches the URL. `nearLabel` names the typed place.
 */
export const nearParams = { near: parseAsString, nearLabel: parseAsString }

export const DEVICE_NEAR = 'me'

export type NearOrigin = {
  point: LatLng
  /** How the sort reads: "Nearest to Leavenworth" or "Nearest to you". */
  label: string
  /** The `near` value the events API takes. */
  query: string
}

function deviceOrigin(device: LatLng | null): NearOrigin | null {
  return device && { point: device, label: 'you', query: formatNearParam(device, 2) }
}

function placeOrigin(near: string | null, label: string | null): NearOrigin | null {
  const point = parseNearParam(near)
  return point && { point, label: label || 'the chosen place', query: formatNearParam(point) }
}

/** Where events are sorted from, or null when they're sorted soonest first. */
export function useNearOrigin(): NearOrigin | null {
  const [{ near, nearLabel }] = useQueryStates(nearParams)
  const device = useDeviceLocation()
  return near === DEVICE_NEAR ? deviceOrigin(device) : placeOrigin(near, nearLabel)
}

/** The `near` value the server rendered with: only a typed place, never the device location. */
export function serverNearQuery(near: string | null): string {
  const point = parseNearParam(near)
  return point ? formatNearParam(point) : ''
}
