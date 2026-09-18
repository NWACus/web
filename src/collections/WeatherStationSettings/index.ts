import { accessByTenantRole } from '@/access/byTenantRole'
import { filterByTenant } from '@/access/filterByTenant'
import { contentHashField } from '@/fields/contentHashField'
import { stationsField } from '@/fields/stations'
import { tenantField } from '@/fields/tenantField'
import { ALL_PRECIP_COLUMNS, PRECIP_COLUMNS } from '@/services/stations/precipColumns'
import {
  revalidateStationPages,
  revalidateStationPagesDelete,
} from '@/services/stations/revalidate'
import { CollectionConfig } from 'payload'

// One document per center for station settings that belong to no single page
// (a unique-tenant "global", per ADR 016): the Accumulated Precipitation
// table's stations and columns. Center-wide graph defaults would land here
// too rather than in a new collection.
export const WeatherStationSettings: CollectionConfig = {
  slug: 'weatherStationSettings',
  labels: { singular: 'Page Settings', plural: 'Page Settings' },
  access: accessByTenantRole('weatherStationSettings'),
  admin: {
    baseListFilter: filterByTenant,
    group: 'Weather',
    useAsTitle: 'centerName',
    defaultColumns: ['centerName', 'updatedAt'],
    description: 'Settings for the weather station pages that belong to the whole center.',
  },
  fields: [
    tenantField({ unique: true }),
    {
      // The document's title: the center's name, read through the tenant.
      name: 'centerName',
      type: 'text',
      virtual: 'tenant.name',
      admin: { hidden: true },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Precipitation Table',
          description:
            'The Accumulated Precipitation page shows these stations, top to bottom, whatever page each is on. Remove one while it has a long-term fault; day-to-day gaps show as "missing" on their own.',
          fields: [
            stationsField({
              name: 'precipStations',
              label: 'Stations',
              description: 'Only stations that report precipitation get a row.',
            }),
          ],
        },
        {
          label: 'Precipitation Columns',
          description:
            'Which columns the Accumulated Precipitation table shows. The station name is always shown.',
          fields: [
            {
              name: 'precipColumns',
              type: 'select',
              label: 'Columns',
              hasMany: true,
              options: [...PRECIP_COLUMNS],
              defaultValue: ALL_PRECIP_COLUMNS,
              admin: {
                description: 'Clearing every column shows them all.',
              },
            },
          ],
        },
      ],
    },
    contentHashField(),
  ],
  hooks: {
    afterChange: [revalidateStationPages],
    afterDelete: [revalidateStationPagesDelete],
  },
}
