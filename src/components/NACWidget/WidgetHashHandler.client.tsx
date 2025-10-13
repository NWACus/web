'use client'
import { useHash } from '@/utilities/useHash'
import { useEffect, useRef } from 'react'

export function WidgetHashHandler({ initialHash }: { initialHash: string }) {
  const hash = useHash()
  const hasSetInitialHash = useRef(false)

  useEffect(() => {
    if (!hasSetInitialHash.current || !hash) {
      window.location.hash = initialHash
      hasSetInitialHash.current = true
    }
  }, [hash, initialHash])

  useEffect(() => {
    hasSetInitialHash.current = false
  }, [initialHash])

  return null
}
