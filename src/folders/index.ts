import { accessByTenantRole } from '@/access/byTenantRole'
import { filterByTenant } from '@/access/filterByTenant'
import { tenantField } from '@/fields/tenantField'
import type { CollectionConfig } from 'payload'

/**
 * Slug of the folder collection Payload auto-generates when folders are enabled.
 * Matches the default in the root `folders` config below. Kept as a shared
 * constant so tenant-scoped bookkeeping (e.g. deprovisioning) stays in sync.
 */
export const FOLDERS_SLUG = 'payload-folders'

/**
 * Root folders configuration.
 *
 * Payload's folder support is enabled per-collection via `folders: true` and
 * this root config, which controls the single auto-generated folder collection
 * shared across every folder-enabled collection. That generated collection has
 * no notion of tenancy on its own, so without intervention every avalanche
 * center would see and be able to reassign every other center's folders.
 *
 * We use the experimental `collectionOverrides` hook to fold the generated
 * collection into the same home-grown multi-tenancy the rest of the app uses:
 * a required `tenant` relationship, the `filterByTenant` base list filter, and
 * tenant-aware RBAC keyed on the `media` permission (folders exist to organize
 * media, so media access governs them).
 *
 * NOTE: the root `folders` config is marked experimental upstream and may
 * change in minor Payload versions.
 */
export const folders = {
  slug: FOLDERS_SLUG,
  collectionOverrides: [
    ({ collection }: { collection: Omit<CollectionConfig, 'trash'> }) => ({
      ...collection,
      access: accessByTenantRole('media'),
      admin: {
        ...collection.admin,
        baseListFilter: filterByTenant,
      },
      fields: [...collection.fields, tenantField()],
    }),
  ],
}
