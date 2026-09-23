import type { Payload } from 'payload'

/** The singular label a collection shows in the admin, falling back to its slug. */
export function collectionLabel(payload: Payload, slug: string): string {
  const label = payload.config.collections.find((c) => c.slug === slug)?.labels?.singular
  return typeof label === 'string' ? label : slug
}
