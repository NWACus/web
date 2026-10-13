'use client'

import type { LatLng } from '@/utilities/geo/distance'
import { parseNearParam } from '@/utilities/geo/nearParam'
import { useMemo, useSyncExternalStore } from 'react'

/**
 * The reader's device location stays in this tab's session, never in the URL, so a shared link
 * or the browser history can't give it away. See docs/events-and-courses.md.
 */
const STORAGE_KEY = 'events:device-location'
const CHANGE_EVENT = 'events:device-location-change'

// Two decimals is about a kilometre: plenty to sort events tens of miles apart, and all that is
// ever stored or sent to the server.
const round = (degrees: number) => Math.round(degrees * 100) / 100

function read(): string | null {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function saveDeviceLocation({ latitude, longitude }: LatLng): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, `${round(latitude)},${round(longitude)}`)
  } catch {
    // Storage can be off (private modes); the location then lasts only until the next reload.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange)
  return () => window.removeEventListener(CHANGE_EVENT, onChange)
}

/** The saved device location, or null on the server, during hydration, or before it's shared. */
export function useDeviceLocation(): LatLng | null {
  // The snapshot is the stored string, which stays the same between renders; parsed afterwards.
  const stored = useSyncExternalStore(subscribe, read, () => null)
  return useMemo(() => parseNearParam(stored), [stored])
}

const LOCATE_ERRORS: Record<number, string> = {
  1: 'Location access is blocked for this site. Allow it in your browser settings, or type a town instead.',
  2: 'Your location isn’t available right now. Type a town or ZIP instead.',
  3: 'Finding your location took too long. Try again, or type a town instead.',
}

/** Asks the browser for the device location. Rejects with a message to show the reader. */
export function requestDeviceLocation(): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('This browser can’t share its location. Type a town or ZIP instead.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      (error) => reject(new Error(LOCATE_ERRORS[error.code] ?? LOCATE_ERRORS[2])),
      // A town-level fix is all a distance sort needs, so no GPS warm-up.
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 10 * 60_000 },
    )
  })
}
