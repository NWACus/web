import type { Payload } from 'payload'
import { isRecord } from './isRecord'

/** The singular label a collection shows in the admin, falling back to its slug. */
export function collectionLabel(payload: Payload, slug: string): string {
  const label = payload.config.collections.find((c) => c.slug === slug)?.labels?.singular
  return typeof label === 'string' ? label : slug
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0

/** A document's human-readable name: its collection's `useAsTitle`, else an upload's filename. */
export function documentTitle(payload: Payload, slug: string, doc: unknown): string | undefined {
  if (!isRecord(doc)) return undefined
  const useAsTitle = payload.config.collections.find((c) => c.slug === slug)?.admin?.useAsTitle
  const titleValue = useAsTitle && useAsTitle !== 'id' ? doc[useAsTitle] : undefined
  return [titleValue, doc.filename].find(isNonEmptyString)
}
