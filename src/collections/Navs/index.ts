import type { CollectionConfig } from 'payload'
import { accessByTenant } from '@/access/byTenant'
import { filterByTenant } from '@/access/filterByTenant'
import { tenantField } from '@/fields/tenantField'
import { titleFromTenantAndCollectionField } from '@/fields/titleFromTenantAndCollectionField'

export const Navs: CollectionConfig = {
  slug: 'navs',
  access: accessByTenant('navs'),
  admin: {
    // the GlobalViewRedirect will never allow a user to visit the list view of this collection but including this list filter as a precaution
    baseListFilter: filterByTenant,
    group: 'Globals',
    useAsTitle: 'titleFromTenantAndCollection',
  },
  disableDuplicate: true,
  fields: [tenantField({ unique: true }), titleFromTenantAndCollectionField],
}
