import type { TenantSlug } from './tenant-cookie'

/** Root domain the app is served from, e.g. `localhost:3000`. */
export const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000'

/**
 * Origin of a tenant's frontend, e.g. `http://nwac.localhost:3000`.
 *
 * Always drive these hosts from the browser (page.goto or an in-page fetch)
 * rather than Playwright's Node-side `request` fixture: Chromium resolves
 * `*.localhost` to loopback on its own, but Node relies on the OS resolver,
 * which has no such rule in the CI container.
 */
export function tenantBaseUrl(slug: TenantSlug): string {
  return `http://${slug}.${ROOT_DOMAIN}`
}

export type { TenantSlug }
