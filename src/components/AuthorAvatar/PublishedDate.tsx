'use client'

import { useTenant } from '@/providers/TenantProvider'
import { formatDateTime } from '@/utilities/formatDateTime'
import { AVALANCHE_CENTERS } from '@/utilities/tenancy/avalancheCenters'

/**
 * A post's published date on the center's calendar. Posts store no timezone, so without
 * this an evening publish reads as the next day for viewers (or servers) east of the center.
 */
export function PublishedDate({ date }: { date: string }) {
  const { tenant } = useTenant()
  const timezone = tenant ? AVALANCHE_CENTERS[tenant.slug].timezone : undefined

  return <p className="text-xs text-brand-400">{formatDateTime(date, timezone, 'MMMM d, yyyy')}</p>
}
