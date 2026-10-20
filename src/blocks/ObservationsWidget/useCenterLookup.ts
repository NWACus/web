'use client'

import { useEffect, useState } from 'react'

export type CenterLookup<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; value: T }
  | { status: 'error' }

// Loads something about the admin's selected center, e.g. from avalanche.org. `load` must be
// stable (a module-level function or server action) or the lookup reruns every render.
export function useCenterLookup<T>(
  center: string | undefined,
  load: (center: string) => Promise<T>,
): CenterLookup<T> {
  const [lookup, setLookup] = useState<CenterLookup<T>>({ status: 'idle' })
  useEffect(() => {
    if (!center) {
      setLookup({ status: 'idle' })
      return
    }
    let cancelled = false
    setLookup({ status: 'loading' })
    load(center).then(
      (value) => {
        if (!cancelled) setLookup({ status: 'ready', value })
      },
      () => {
        if (!cancelled) setLookup({ status: 'error' })
      },
    )
    return () => {
      cancelled = true
    }
  }, [center, load])
  return lookup
}
