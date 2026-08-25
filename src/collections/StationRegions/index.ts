import { accessByTenantRole } from '@/access/byTenantRole'
import { filterByTenant } from '@/access/filterByTenant'
import { contentHashField } from '@/fields/contentHashField'
import { slugField } from '@/fields/slug'
import { tenantField } from '@/fields/tenantField'
import { CollectionConfig } from 'payload'

// The headings on the station index. Ported from Django's `Area`, `order`
// included -- the index reads north to south, which alphabetical would destroy.
//
// Nothing upstream can supply these: SnowObs knows a station's `state` and
// `weather_station_partner`, which is ownership rather than geography, so
// "Mountain Loop" exists only because someone decided it does.
export const StationRegions: CollectionConfig = {
  slug: 'stationRegions',
  access: accessByTenantRole('stationRegions'),
  admin: {
    baseListFilter: filterByTenant,
    group: 'Weather',
    defaultColumns: ['name', 'rank'],
    useAsTitle: 'name',
    description: 'Groups the weather station index. Ordered by rank, north to south.',
  },
  defaultSort: 'rank',
  fields: [
    tenantField(),
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    slugField('name'),
    {
      name: 'rank',
      type: 'number',
      required: true,
      index: true,
      admin: {
        description: 'Lower sorts first. Existing regions run north to south.',
      },
    },
    contentHashField(),
  ],
}
