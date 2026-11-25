import type { PopulateType } from 'payload'

/**
 * `populate` for rendering a page, post or event. Each excluded relation is an extra query per
 * nesting level; collections not listed use their own `defaultPopulate`.
 */
export const contentPopulate = {
  tenants: { slug: true, name: true },
  media: { tenant: false },
  biographies: { tenant: false },
  galleries: { tenant: false },
  teams: { tenant: false },
  events: { content: false, tenant: false },
} satisfies PopulateType
