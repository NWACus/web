import { accessByTenantRole } from '@/access/byTenantRole'
import { filterByTenant } from '@/access/filterByTenant'
import { contentHashField } from '@/fields/contentHashField'
import { slugField } from '@/fields/slug'
import { tenantField } from '@/fields/tenantField'
import {
  revalidateStationPages,
  revalidateStationPagesDelete,
} from '@/services/stations/revalidate'
import { CollectionConfig } from 'payload'

// A page under /weather/stations. Not a station: 17 of the 32 cover more than
// one logger, because a forecaster reading Alpental wants the temperature at
// all three elevations side by side.
//
// This is everything SnowObs cannot say about a page -- its URL and its name --
// and nothing SnowObs can. Which stations are on it is recorded on the stations
// themselves (each points at its group), and which columns it shows is derived
// from what those stations report.
export const StationGroups: CollectionConfig = {
  slug: 'stationGroups',
  labels: { singular: 'Station Page', plural: 'Station Pages' },
  access: accessByTenantRole('stationGroups'),
  admin: {
    baseListFilter: filterByTenant,
    group: 'Weather',
    defaultColumns: ['displayName', 'slug', 'archived'],
    useAsTitle: 'displayName',
    description:
      'The weather station pages. Assign stations to a page from the Stations list; the table columns follow what those stations report.',
  },
  defaultSort: 'displayName',
  fields: [
    tenantField(),
    {
      name: 'displayName',
      type: 'text',
      required: true,
    },
    slugField('displayName'),
    {
      name: 'stations',
      type: 'join',
      collection: 'stations',
      on: 'group',
      admin: {
        description: 'Set on each station. Ordered by "group order", then elevation.',
      },
    },
    {
      name: 'graphAxes',
      type: 'group',
      label: 'Graph axis floors',
      admin: {
        description:
          'Optional per-page floors for the graph axes, in inches. The axis always covers at least this much and widens for bigger readings. Blank uses the site default.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'snowDepthMax', type: 'number', label: 'Snow depth', min: 0 },
            { name: 'snowfall24Max', type: 'number', label: '24-hour snowfall', min: 0 },
            { name: 'precipMax', type: 'number', label: 'Hourly precip', min: 0 },
          ],
        },
      ],
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
