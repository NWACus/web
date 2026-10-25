'use client'

/**
 * Hands an old forecast-widget link over to its native address (see `legacyWidgetHash.ts`): read
 * on view, since the hash never reaches the server, and replaced rather than pushed, so Back skips
 * it. An archived product the server can't place goes to the archive: the live page this one would
 * otherwise show isn't the forecast the link named. Renders nothing.
 */
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import {
  UNPLACED_PRODUCT_ADDRESS,
  forecastAddressEndpoint,
  needsFullLoad,
  widgetHashTarget,
  type WidgetHashContext,
  type WidgetHashTarget,
} from './legacyWidgetHash'

interface LegacyWidgetHashHandOverProps extends WidgetHashContext {
  center: string
}

export function LegacyWidgetHashHandOverClient({
  center,
  zones,
  weatherArchive,
}: LegacyWidgetHashHandOverProps) {
  const router = useRouter()

  useEffect(() => {
    let cancelled = false
    const handOver = () => {
      const target = widgetHashTarget(window.location.hash, { zones, weatherArchive })
      if (!target) return
      void addressFor(center, target).then((address) => {
        if (cancelled) return
        if (needsFullLoad(address, window.location.href)) window.location.replace(address)
        else router.replace(address)
      })
    }

    handOver()
    // A widget link opened from this same page changes only the hash, without a reload.
    window.addEventListener('hashchange', handOver)
    return () => {
      cancelled = true
      window.removeEventListener('hashchange', handOver)
    }
  }, [center, zones, weatherArchive, router])

  return null
}

async function addressFor(center: string, target: WidgetHashTarget): Promise<string> {
  if ('address' in target) return target.address
  try {
    const res = await fetch(forecastAddressEndpoint(center, target.productId, target.zoneId))
    const body: { address?: string | null } = res.ok ? await res.json() : {}
    return body.address ?? UNPLACED_PRODUCT_ADDRESS
  } catch {
    return UNPLACED_PRODUCT_ADDRESS
  }
}
