'use client'

import { useSyncExternalStore } from 'react'
import { getBrowserTimezone } from './getBrowserTimezone'

const subscribe = () => () => {}

/**
 * The viewer's IANA timezone, or null on the server and during hydration so server-rendered
 * markup never depends on it. React re-renders with the real value once hydration finishes.
 */
export function useViewerTimezone(): string | null {
  return useSyncExternalStore(subscribe, getBrowserTimezone, () => null)
}
