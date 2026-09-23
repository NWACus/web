import type { CollectionSlug } from 'payload'

// Collections that no Tenant owns. See docs/decisions/022-shared-content.md.
export const SHARED_CONTENT_ADMIN_GROUP = 'Shared Content'

export const SHARED_CONTENT_COLLECTIONS: ReadonlySet<CollectionSlug> = new Set(['sharedMedia'])

// The set is keyed by slug; callers walking field configs only hold a plain string.
const sharedContentSlugs: ReadonlySet<string> = SHARED_CONTENT_COLLECTIONS

export const isSharedContentCollection = (slug: string): slug is CollectionSlug =>
  sharedContentSlugs.has(slug)

// Shared uploads get a blob folder of their own under the environment's, because tenant
// files in that folder are kept apart only by the tenant slug on their filename.
export const getSharedMediaBlobPrefix = (environmentPrefix: string): string =>
  `${environmentPrefix}/shared`

// Spread into a Shared Content collection's `admin.components.edit.beforeDocumentControls`.
// Registration by string path is what makes the component reachable from the import map.
export const SHARED_CONTENT_EDIT_CONTROLS = [
  '@/components/SharedContent/SuggestEditDrawer#SuggestEditDrawer',
]

/** Long enough for a paragraph of context, short enough that nobody pastes a document into it. */
export const MAX_SUGGESTION_LENGTH = 2000

// Shared collections carrying a `referenceCount` field. Add a slug here when its collection gains
// `referenceCountField()`; `__tests__/server/referenceCountCoverage.server.test.ts` holds the two
// in step.
export const REFERENCE_COUNTED_COLLECTIONS = ['sharedMedia'] as const

export type ReferenceCountedCollection = (typeof REFERENCE_COUNTED_COLLECTIONS)[number]
