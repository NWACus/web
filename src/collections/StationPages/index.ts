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
import { STATION_COLUMNS } from '@/services/stations/stationColumns'
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
        'The SnowObs stations this page shows, in this order, on its table, graphs and download. Drag to reorder, or search below to add one.',
    }),
    {
      name: 'columns',
      type: 'select',
      label: 'Table columns',
      hasMany: true,
      options: STATION_COLUMNS,
      admin: {
        description:
          'Which readings the table shows, in this order, for every station on the page. Drag to reorder. Clearing every reading shows all the stations report.',
      },
    },
    {
      name: 'tabs',
      type: 'group',
      label: 'Tabs',
      admin: {
        position: 'sidebar',
        description: 'Which views the page shows. A hidden tab falls back to the first shown one.',
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
