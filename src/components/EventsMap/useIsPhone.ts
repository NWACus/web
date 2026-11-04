'use client'

import { cssVariables } from '@/cssVariables'
import { useSyncExternalStore } from 'react'

/** Below Tailwind's `md`, where the events page swaps its filters sidebar for a drawer. */
const PHONE = `(max-width: ${cssVariables.breakpoints.md - 1}px)`

function subscribe(onChange: () => void) {
  const query = window.matchMedia(PHONE)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

/** Whether the map view should fill the screen; the server, with no viewport, says no. */
export function useIsPhone(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(PHONE).matches,
    () => false,
  )
}
