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
    const target = widgetHashTarget(window.location.hash, { zones, weatherArchive })
    if (!target) return

    let cancelled = false
    void addressFor(center, target).then((address) => {
      if (!cancelled) router.replace(address)
    })

    return () => {
      cancelled = true
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
