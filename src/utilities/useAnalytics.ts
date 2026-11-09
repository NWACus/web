'use client'
import posthog from 'posthog-js'
import { getPostHogEnvironment } from './getPostHogEnvironment'

// Super properties every browser event carries, named to match AvyApp
export function getPostHogSuperProperties() {
  return {
    source: 'nwacus/web',
    environment: getPostHogEnvironment(),
  }
}

export function getPostHogCenterProperties(tenantSlug: string) {
  return { center: tenantSlug.toUpperCase() }
}

function capture(event: string, properties: Record<string, string> = {}) {
  posthog.capture(event, properties)
}

// Super properties supply source, environment and center; call sites only pass event-specific data.
export function useAnalytics() {
  return { capture }
}
