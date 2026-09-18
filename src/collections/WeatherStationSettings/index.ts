import { accessByTenantRole } from '@/access/byTenantRole'
import { filterByTenant } from '@/access/filterByTenant'
import { contentHashField } from '@/fields/contentHashField'
import { stationsField } from '@/fields/stations'
import { tenantField } from '@/fields/tenantField'
import {
  revalidateStationPages,
  revalidateStationPagesDelete,
} from '@/services/stations/revalidate'
import { CollectionConfig } from 'payload'

// One document per center for station settings that belong to no single page
// (a unique-tenant "global", per ADR 016). Today that is the Accumulated
// Precipitation table's station list; center-wide graph defaults would land
// here too rather than in a new collection.
export const WeatherStationSettings: CollectionConfig = {
  slug: 'weatherStationSettings',
  access: accessByTenantRole('weatherStationSettings'),
  admin: {
    baseListFilter: filterByTenant,
    group: 'Weather',
    defaultColumns: ['tenant', 'updatedAt'],
    description: 'Station settings for the whole center, as opposed to one page.',
  },
  fields: [
    tenantField({ unique: true }),
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Precipitation Table',
          description:
            'The Accumulated Precipitation page shows these gauges, top to bottom, whatever page each is on. Remove one while it has a long-term fault; day-to-day gaps show as "missing" on their own.',
          fields: [
            stationsField({
              name: 'precipStations',
              label: 'Gauges',
              description: 'Only stations that report precipitation get a row.',
            }),
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
