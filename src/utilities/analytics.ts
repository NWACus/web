import { useTenant } from '@/providers/TenantProvider'
import posthog from 'posthog-js'

export const ANALYTICS_PROPERTY = {
  TENANT: 'tenant',
} as const

export function useAnalytics() {
  const { tenant } = useTenant()

  function captureWithTenant(event: string, properties: Record<string, any> = {}) {
    posthog.capture(event, {
      ...properties,
      [ANALYTICS_PROPERTY.TENANT]: tenant?.slug ?? 'unknown',
    })
  }

  return { captureWithTenant }
}
