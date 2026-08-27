import { accessByTenantRole } from '@/access/byTenantRole'
import { filterByTenant } from '@/access/filterByTenant'
import { contentHashField } from '@/fields/contentHashField'
import { tenantField } from '@/fields/tenantField'
import { hasGlobalRolePermission } from '@/utilities/rbac/hasGlobalOrTenantRolePermission'
import { CollectionConfig } from 'payload'

// Durable store for MWF model-guidance artifacts: one row per (tenant, table),
// written by the guidance cache on every successful build and read back to
// warm a cold process. On serverless the in-process cache alone is
// near-useless — the hourly cron builds in one instance and the editor loads
// in another, and keep-last-good has nothing to keep — so this row is the
// artifact of record and the in-process map is only a hot layer (products-api
// persists to disk for the same reason). All writes go through the Local API;
// the collection is a super-admin debugging surface, not an authoring one.
export const MwfGuidanceArtifacts: CollectionConfig = {
  slug: 'mwfGuidanceArtifacts',
  access: accessByTenantRole('mwfGuidanceArtifacts'),
  labels: {
    singular: 'MWF Guidance Artifact',
    plural: 'MWF Guidance Artifacts',
  },
  admin: {
    baseListFilter: filterByTenant,
    group: 'Forecasts',
    hidden: ({ user }) =>
      !hasGlobalRolePermission({ method: 'update', collection: 'mwfGuidanceArtifacts', user }),
    useAsTitle: 'table',
    defaultColumns: ['table', 'updatedAt'],
  },
  indexes: [{ fields: ['tenant', 'table'], unique: true }],
  fields: [
    tenantField(),
    {
      name: 'table',
      type: 'select',
      required: true,
      options: [
        { label: 'Precipitation', value: 'precip' },
        { label: 'Temperatures', value: 'temps' },
        { label: 'Ridgeline Winds', value: 'winds' },
      ],
      admin: { description: 'Which editor guidance table this artifact feeds' },
    },
    {
      name: 'artifact',
      type: 'json',
      required: true,
      admin: { description: 'The last good guidance artifact, as served to the editor' },
    },
    contentHashField(),
  ],
}
