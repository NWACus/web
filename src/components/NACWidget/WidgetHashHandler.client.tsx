'use client'
import { useHash } from '@/utilities/useHash'
import { useEffect, useRef } from 'react'

export function WidgetHashHandler({
  initialHash,
  cleanUrl,
}: {
  initialHash: string
  cleanUrl?: string
}) {
  const hash = useHash()
  const hasInitialized = useRef(false)

  useEffect(() => {
    if (hasInitialized.current) return

    const existingHash = window.location.hash
    const hasExistingHash = existingHash && existingHash !== '#'

    if (!hasExistingHash) {
      if (cleanUrl) {
        window.history.replaceState({}, '', `${cleanUrl}#${initialHash}`)
      } else {
        window.history.replaceState(null, '', initialHash)
      }
    }

    hasInitialized.current = true
  }, [hash, initialHash, cleanUrl])

  useEffect(() => {
    hasInitialized.current = false
  }, [initialHash])

  return null
}
