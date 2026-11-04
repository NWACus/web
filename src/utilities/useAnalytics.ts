'use client'
import posthog from 'posthog-js'
import { getPostHogEnvironment } from './getPostHogEnvironment'

/**
 * Super properties every browser event carries. `platform` duplicates `source` for one release so
 * saved insights can move to the shared names, then it goes.
 */
export function getPostHogSuperProperties() {
  return {
    source: 'nwacus/web',
    platform: 'AvyWeb',
    environment: getPostHogEnvironment(),
  }
}

/**
 * Properties identifying the center. `tenant` duplicates `center` for one release, then it goes.
 */
export function getPostHogCenterProperties(tenantSlug: string) {
  return {
    center: tenantSlug.toUpperCase(),
    tenant: tenantSlug,
  }
}

function capture(event: string, properties: Record<string, string> = {}) {
  posthog.capture(event, properties)
}

// Super properties supply source, environment and center; call sites only pass event-specific data.
export function useAnalytics() {
  return { capture }
}
