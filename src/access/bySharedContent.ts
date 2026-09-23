import { canReadSharedContent } from '@/utilities/rbac/canReadSharedContent'
import { ruleCollection } from '@/utilities/rbac/ruleMatches'
import type { CollectionConfig } from 'payload'
import { byGlobalRole } from './byGlobalRole'

// Shared Content is owned by no tenant: only a global role rule grants write, while read is
// structural. See docs/decisions/022-shared-content.md.
export const accessBySharedContent: (collection: ruleCollection) => CollectionConfig['access'] = (
  collection: ruleCollection,
) => {
  return {
    create: byGlobalRole('create', collection),
    read: ({ req: { user } }) => canReadSharedContent({ collection, user }),
    // Unset, Payload lets any logged-in user read versions, provider accounts included
    readVersions: ({ req: { user } }) => canReadSharedContent({ collection, user }),
    update: byGlobalRole('update', collection),
    delete: byGlobalRole('delete', collection),
  }
}

// An upload collection needs this variant: a document's `url` is the Payload file route, so the
// browser fetches the bytes anonymously and a structural `read` would 403 every public page.
// Media solves it the same way, pairing world-readable documents with a stricter `admin.hidden`.
export const accessBySharedContentWithPermissiveRead: (
  collection: ruleCollection,
) => CollectionConfig['access'] = (collection: ruleCollection) => {
  return {
    ...accessBySharedContent(collection),
    read: () => true, // world readable
  }
}
