'use client'
import { useHash } from '@/utilities/useHash'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

export function WidgetHashHandler({
  initialHash,
  searchParams,
}: {
  initialHash: string
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  const hash = useHash()
  const hasInitialized = useRef(false)
  const pathname = usePathname()

  let redirectUrl = undefined

  if (searchParams) {
    // Build query params, preserving array values
    const queryParams = new URLSearchParams()
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value === undefined) return
      // Need to decode for NAC widget
      if (Array.isArray(value)) {
        value.forEach((v) => queryParams.append(key, decodeURIComponent(v)))
      } else {
        queryParams.set(key, decodeURIComponent(value))
      }
    })

    const tabView = queryParams.get('tabView') || 'observations'
    queryParams.delete('tabView')
    const queryString = queryParams.toString()
    initialHash = `/view/${tabView}${queryString ? `?${queryString}` : ''}`
    redirectUrl = queryString ? pathname : undefined
  }

  useEffect(() => {
    if (hasInitialized.current) return

    const existingHash = window.location.hash
    const hasExistingHash = existingHash && existingHash !== '#'

    if (!hasExistingHash) {
      if (redirectUrl) {
        window.history.replaceState({}, '', `${redirectUrl}#${initialHash}`)
      } else {
        window.history.replaceState(null, '', initialHash)
      }
    }

    hasInitialized.current = true
  }, [hash, initialHash, redirectUrl])

  useEffect(() => {
    hasInitialized.current = false
  }, [initialHash])

  return null
}
