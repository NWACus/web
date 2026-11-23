import type { CaptureOptions, PostHog } from 'posthog-js'

export const POSTHOG_SOURCE = 'nwacus/web'

/**
 * The slice of the PostHog client handed to embedded NAC widgets: capture plus read-only
 * accessors. No register/identify/reset, so a widget can't rewrite host super properties
 * that persist across sessions. Method names match posthog-js so widget code works unchanged.
 */
export type WidgetPostHogClient = {
  capture: (event: string, properties?: Record<string, unknown>, options?: CaptureOptions) => void
  get_distinct_id: () => string
  get_session_id: () => string
  get_property: (key: string) => unknown
}

export function createWidgetPostHogClient(client: PostHog): WidgetPostHogClient {
  return {
    capture: (event, properties, options) => {
      client.capture(event, { ...properties, host_source: POSTHOG_SOURCE }, options)
    },
    get_distinct_id: () => client.get_distinct_id(),
    get_session_id: () => client.get_session_id(),
    get_property: (key) => client.get_property(key),
  }
}
