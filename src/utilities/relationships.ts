/**
 * Utility functions for safely handling Payload CMS relationship fields.
 *
 * Relationship fields can be:
 * - A resolved object (when populated)
 * - A number (ID when not populated)
 * - null/undefined (when the related document was deleted)
 *
 * These utilities provide type-safe ways to check and filter relationships.
 */

/**
 * Type guard to check if a relationship field is resolved to an object
 * (not an unresolved ID number or null/undefined)
 *
 * @example
 * if (isValidRelationship(page.form)) {
 *   // TypeScript knows form is an object here
 *   console.log(page.form.fields)
 * }
 */
export function isValidRelationship<T extends { id: string | number }>(
  relationship: T | number | null | undefined,
): relationship is T {
  return typeof relationship === 'object' && relationship !== null
}

/**
 * Type guard that checks if a relationship is resolved AND published
 * (for collections with draft status)
 *
 * @example
 * if (isValidPublishedRelationship(page.post)) {
 *   // TypeScript knows post is a published Post object
 *   console.log(page.post.title)
 * }
 */
export function isValidPublishedRelationship<
  T extends { id: string | number; _status?: string | null },
>(relationship: T | number | null | undefined): relationship is T {
  return (
    typeof relationship === 'object' &&
    relationship !== null &&
    (!relationship._status || relationship._status === 'published')
  )
}

/**
 * Filters an array of relationship fields to only resolved objects,
 * removing unresolved IDs and null/undefined values
 *
 * @example
 * const validSponsors = filterValidRelationships(page.sponsors)
 * validSponsors.forEach(sponsor => console.log(sponsor.name))
 */
export function filterValidRelationships<T extends { id: string | number }>(
  relationships: (T | number | null | undefined)[] | null | undefined,
): T[] {
  if (!relationships) return []
  return relationships.filter(isValidRelationship)
}

/**
 * Filters an array of relationship fields to only resolved AND published objects
 *
 * @example
 * const publishedPosts = filterValidPublishedRelationships(page.relatedPosts)
 * publishedPosts.forEach(post => console.log(post.title))
 */
export function filterValidPublishedRelationships<
  T extends { id: string | number; _status?: string | null },
>(relationships: (T | number | null | undefined)[] | null | undefined): T[] {
  if (!relationships) return []
  return relationships.filter(isValidPublishedRelationship)
}
