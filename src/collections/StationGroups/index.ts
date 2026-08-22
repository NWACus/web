import { accessByTenantRole } from '@/access/byTenantRole'
import { filterByTenant } from '@/access/filterByTenant'
import { contentHashField } from '@/fields/contentHashField'
import { slugField } from '@/fields/slug'
import { tenantField } from '@/fields/tenantField'
import { TABLE_COLUMN_OPTIONS } from '@/services/snowobs/tableColumns'
import { getTenantFilter } from '@/utilities/collectionFilters'
import { CollectionConfig } from 'payload'

// The stations picker holds ids while the form is open and populated docs once
// the document is read back, so a column's options are narrowed off whichever
// shape is in hand.
function groupStationIds(data?: { stations?: unknown }): number[] {
  if (!Array.isArray(data?.stations)) return []
  return data.stations.flatMap((station) => {
    if (typeof station === 'number') return [station]
    if (station && typeof station === 'object' && 'id' in station) {
      const id = station.id
      return typeof id === 'number' ? [id] : []
    }
    return []
  })
}

// A page under /weather/stations. Not a station and not a region: 17 of the 32
// cover more than one logger, because a forecaster reading Alpental wants the
// temperature at all three elevations side by side.
//
// The table layout lives here rather than on the stations because it is a
// property of the page: one row per reading, naming the loggers that report it,
// in the order the columns appear. No station is on two pages today, so nothing
// is said twice by keeping it here -- and the page becomes readable in one
// document instead of assembled from several.
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
        description: 'Every logger this page covers, in tables, graphs and downloads alike.',
      },
    },
    {
      name: 'tableColumnsDivider',
      type: 'ui',
      admin: {
        components: {
          Field: '@/collections/StationGroups/components/FieldDivider#FieldDivider',
        },
      },
    },
    {
      name: 'tableColumns',
      type: 'array',
      labels: { singular: 'Table Column', plural: 'Table Columns' },
      fields: [
        {
          name: 'variable',
          type: 'select',
          required: true,
          options: TABLE_COLUMN_OPTIONS,
        },
        {
          name: 'stations',
          type: 'relationship',
          relationTo: 'stations',
          hasMany: true,
          required: true,
          // Only the loggers this page already covers, so the two lists cannot
          // drift into a column for a station the page does not show.
          filterOptions: (args) => ({
            and: [getTenantFilter(args), { id: { in: groupStationIds(args.data) } }],
          }),
          admin: {
            description: 'Which loggers report this reading, in the order the columns appear.',
          },
        },
      ],
      admin: {
        description:
          'The NOW table, one row per reading. Graphs are separate: every station is offered all 12 presets and the ones with no data hide themselves, so battery voltage charts without being a column here.',
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
