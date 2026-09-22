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
    update: byGlobalRole('update', collection),
    delete: byGlobalRole('delete', collection),
  }
}
