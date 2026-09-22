import type { CollectionSlug } from 'payload'

// Collections that no Tenant owns. See docs/decisions/022-shared-content.md.
export const SHARED_CONTENT_ADMIN_GROUP = 'Shared Content'

export const SHARED_CONTENT_COLLECTIONS: ReadonlySet<CollectionSlug> = new Set(['sharedMedia'])

// The set is keyed by slug; callers walking field configs only hold a plain string.
const sharedContentSlugs: ReadonlySet<string> = SHARED_CONTENT_COLLECTIONS

export const isSharedContentCollection = (slug: string): boolean => sharedContentSlugs.has(slug)
