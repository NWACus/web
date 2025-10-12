import { accessByTenantRole } from '@/access/byTenantRole'
import { contentHashField } from '@/fields/contentHashField'
import { slugField } from '@/fields/slug'
import { CollectionConfig } from 'payload'

export const PluralCollectionName: CollectionConfig = {
  slug: 'pluralCollectionSlug',
  // @ts-expect-error this slug doesn't exist in our types because this is an example, remove this ts-expect-error when copying
  access: accessByTenantRole('pluralCollectionSlug'),
  // Or one of:
  // access: accessByTenantRoleOrReadPublished('pluralCollectionSlug'),
  // access: accessByTenantRoleWithPermissiveRead('pluralCollectionSlug'),
  fields: [
    // Optionally add tenantField:
    // tenantField(),
    // Or for a "global collection" (i.e. one per tenant):
    // tenantField({ unique: true }),
    slugField(),
    contentHashField(),
  ],
}
