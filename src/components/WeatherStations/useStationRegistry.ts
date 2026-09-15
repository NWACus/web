'use client'

import { getStationRegistry, type StationRegistry } from '@/constants/weatherStations'
import { useTenant } from '@/providers/TenantProvider'

export function useStationRegistry(): StationRegistry | undefined {
  const { tenant } = useTenant()
  return tenant ? getStationRegistry(tenant.slug) : undefined
}
