'use client'
import { useHash } from '@/utilities/useHash'
import { useEffect } from 'react'

export function WidgetHashHandler({ initialHash }: { initialHash: string }) {
  const hash = useHash()

  useEffect(() => {
    if (!hash) {
      window.location.hash = initialHash
    }
  }, [hash, initialHash])

  return null
}
