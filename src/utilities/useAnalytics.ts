'use client'
import { useTenant } from '@/providers/TenantProvider'
import posthog from 'posthog-js'
import { getEnvironmentFriendlyName } from './getEnvironmentFriendlyName'

export const defaultPostHogProperties = {
  platform: 'AvyWeb',
  environment: getEnvironmentFriendlyName(),
}

export function useAnalytics() {
  const { tenant } = useTenant()

  function captureWithTenant(event: string, properties: Record<string, string> = {}) {
    posthog.capture(event, {
      ...defaultPostHogProperties,
      tenant: tenant?.slug ?? 'unknown',
      ...properties,
    })
  }

  return { captureWithTenant }
}
