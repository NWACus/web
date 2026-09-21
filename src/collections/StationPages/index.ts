import { accessByTenantRole } from '@/access/byTenantRole'
import { filterByTenant } from '@/access/filterByTenant'
import { contentHashField } from '@/fields/contentHashField'
import { slugField } from '@/fields/slug'
import { columnsField } from '@/fields/stationColumns'
import { stationsField } from '@/fields/stations'
import { tenantField } from '@/fields/tenantField'
import {
  revalidateStationPages,
  revalidateStationPagesDelete,
} from '@/services/stations/revalidate'
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
// The table's columns follow what those stations report unless the page
// lists its own.
export const StationPages: CollectionConfig = {
  slug: 'stationPages',
  access: accessByTenantRole('stationPages'),
  admin: {
    baseListFilter: filterByTenant,
    group: 'Content',
    defaultColumns: ['displayName', 'slug', 'archived'],
    useAsTitle: 'displayName',
    description:
      'The weather station pages. Each lists the SnowObs stations it shows, in order; the table columns follow what those stations report unless the page chooses its own.',
  },
  defaultSort: 'displayName',
  // The slug is the URL; two pages sharing one would shadow each other.
  indexes: [{ fields: ['tenant', 'slug'], unique: true }],
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
    }),
    columnsField({
      name: 'columns',
      label: 'Table columns',
      description:
        'Leave empty to show every reading the stations report, grouped by reading. Add columns to choose exactly which readings the table shows, in this order.',
    }),
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
