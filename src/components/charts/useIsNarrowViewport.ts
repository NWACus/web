'use client'

import { useSyncExternalStore } from 'react'

/** Tailwind's `sm` breakpoint. Below it a chart has to spend its width differently. */
const NARROW = '(max-width: 639px)'

function subscribe(onChange: () => void) {
  const query = window.matchMedia(NARROW)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

function getSnapshot(): boolean {
  return window.matchMedia(NARROW).matches
}

/**
 * The server has no viewport. Charts render client-side only (`ssr: false`), so the value this
 * returns never reaches the server's HTML — it only has to be stable enough not to warn.
 */
function getServerSnapshot(): boolean {
  return false
}

/**
 * Whether the viewport is below `sm`, for layout a CSS breakpoint cannot reach — an ECharts option
 * is JavaScript, so a chart that wants a different axis on a phone has to be told.
 */
export function useIsNarrowViewport(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
