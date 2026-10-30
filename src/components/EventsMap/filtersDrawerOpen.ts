'use client'

import { useSyncExternalStore } from 'react'

/**
 * Whether the events page's phone filter drawer is open. Kept outside React state so the map
 * view's floating Filters button can open the drawer the page renders elsewhere.
 */
let open = false
const listeners = new Set<() => void>()

export function setFiltersDrawerOpen(next: boolean) {
  open = next
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useFiltersDrawerOpen(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => open,
    () => false,
  )
}
