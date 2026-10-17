import { accessByTenantRole } from '@/access/byTenantRole'
import { filterByTenant } from '@/access/filterByTenant'
import { contentHashField } from '@/fields/contentHashField'
import { slugField } from '@/fields/slug'
import { stationsField } from '@/fields/stations'
import { tenantField } from '@/fields/tenantField'
import {
  revalidateStationPages,
  revalidateStationPagesDelete,
} from '@/services/stations/revalidate'
import { stationTabFields } from '@/services/stations/stationTabs'
import { CollectionConfig } from 'payload'
import { trackedStations } from './endpoints/trackedStations'

// A page under /weather/stations. Not a station: 17 of NWAC's 32 cover more
// than one logger, because a forecaster reading Alpental wants the temperature
// at all three elevations side by side.
//
// This is everything SnowObs cannot say about a page -- its URL, its name and
// which stations it shows, in what order -- and nothing SnowObs can. A station
// is only ever a (source, stid) reference; its name, elevation and coordinates
// are read live from SnowObs, both here (the picker) and on the public page.
// The table's columns follow what those stations report unless a station
// chooses its own readings or the page reorders them.
export const StationPages: CollectionConfig<'stationPages'> = {
  slug: 'stationPages',
  access: accessByTenantRole('stationPages'),
  defaultPopulate: {
    displayName: true,
    slug: true,
  },
  admin: {
    baseListFilter: filterByTenant,
    group: 'Content',
    defaultColumns: ['displayName', 'slug', 'archived'],
    useAsTitle: 'displayName',
    components: {
      edit: {
        SaveButton:
          '@/collections/StationPages/components/PublishChangesButton#PublishChangesButton',
        beforeDocumentControls: [
          '@/collections/StationPages/components/ViewStationPageButton#ViewStationPageButton',
        ],
      },
    },
    description:
      'A public weather page for a group of SnowObs stations as a table, graphs and CSV download.',
  },
  defaultSort: 'displayName',
  endpoints: [{ path: '/tracked-stations', method: 'get', handler: trackedStations }],
  fields: [
    tenantField(),
    {
      name: 'displayName',
      type: 'text',
      required: true,
    },
    slugField('displayName'),
    stationsField({
      name: 'stations',
      label: 'Stations',
      description:
        'The SnowObs stations this page shows, in this order, on its table, graphs and download. Drag to reorder, or search below to add one. Edit a station’s table columns to choose which of its readings the table shows.',
      perStationColumns: true,
    }),
    {
      name: 'columnOrder',
      type: 'json',
      label: 'Column order',
      defaultValue: [],
      admin: {
        description:
          'Every column the table shows, one per station and reading, in table order. Drag a column to move it. A column added later goes after the others for its reading.',
        components: {
          Field: '@/collections/StationPages/components/ColumnOrderInput#ColumnOrderInput',
        },
      },
      typescriptSchema: [
        () => ({
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stid: { type: 'string' },
              source: { type: 'string' },
              variable: { type: 'string' },
            },
            required: ['stid', 'source', 'variable'],
            additionalProperties: false,
          },
        }),
      ],
    },
    {
      name: 'tabs',
      type: 'group',
      label: 'Tabs',
      admin: {
        position: 'sidebar',
        description: 'Which views the page shows. An archived page shows only Download.',
      },
      fields: stationTabFields,
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
  hooks: {
    afterChange: [revalidateStationPages],
    afterDelete: [revalidateStationPagesDelete],
  },
}
