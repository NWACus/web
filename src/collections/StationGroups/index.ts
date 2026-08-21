import { accessByTenantRole } from '@/access/byTenantRole'
import { filterByTenant } from '@/access/filterByTenant'
import { contentHashField } from '@/fields/contentHashField'
import { slugField } from '@/fields/slug'
import { tenantField } from '@/fields/tenantField'
import { getTenantFilter } from '@/utilities/collectionFilters'
import { CollectionConfig } from 'payload'

// A page under /weather/stations. Not a station and not a region: 17 of the 32
// cover more than one logger, because a forecaster reading Alpental wants the
// temperature at all three elevations side by side.
//
// Columns are derived rather than stored: for each variable in the site-wide
// order, a column per station that has it selected. The station list's own
// order is what interleaves them, which is why it is drag-sortable.
//
// This cannot be synced. SnowObs has no concept of a page, a slug or a display
// name -- `station/tracking` is a flat client-to-stid list -- so groups are
// editorial and always will be.
export const StationGroups: CollectionConfig = {
  slug: 'stationGroups',
  access: accessByTenantRole('stationGroups'),
  admin: {
    baseListFilter: filterByTenant,
    group: 'Weather',
    defaultColumns: ['displayName', 'region', 'slug', 'archived'],
    useAsTitle: 'displayName',
    description: 'The weather station pages, and which loggers and columns each one shows.',
  },
  fields: [
    tenantField(),
    {
      name: 'displayName',
      type: 'text',
      required: true,
    },
    slugField('displayName'),
    {
      name: 'legacySlug',
      type: 'text',
      admin: {
        description: 'Old nwac.us /weatherdata/<slug>/now/ path, kept so redirects can be built.',
      },
    },
    {
      name: 'region',
      type: 'relationship',
      relationTo: 'stationRegions',
      required: true,
      filterOptions: getTenantFilter,
      admin: { description: 'Which heading this page appears under on the index.' },
    },
    {
      name: 'stations',
      type: 'relationship',
      relationTo: 'stations',
      hasMany: true,
      required: true,
      filterOptions: getTenantFilter,
      admin: {
        description:
          'Every logger whose readings appear on this page, in the order their columns appear.',
      },
    },
    {
      name: 'archived',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description:
          'The hardware is gone but the history is still queryable, so the page stays up for downloads.',
      },
    },
    contentHashField(),
  ],
}
