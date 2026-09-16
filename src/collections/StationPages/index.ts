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
// themselves (each points at its page), and which columns it shows is derived
// from what those stations report.
export const StationPages: CollectionConfig = {
  slug: 'stationPages',
  // The generated `StationPage` name belongs to the assembled page in services/stations.
  typescript: { interface: 'StationPageDoc' },
  access: accessByTenantRole('stationPages'),
  admin: {
    baseListFilter: filterByTenant,
    group: 'Weather',
    defaultColumns: ['displayName', 'slug', 'archived'],
    useAsTitle: 'displayName',
    description:
      'The weather station pages. Assign stations to a page from the Stations list; the table columns follow what those stations report.',
  },
  defaultSort: 'displayName',
  // The slug is the URL; two pages sharing one would shadow each other.
  indexes: [{ fields: ['tenant', 'slug'], unique: true }],
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
      on: 'page',
      admin: {
        description: 'Set on each station. Ordered by "page order", then elevation.',
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
  hooks: {
    afterChange: [revalidateStationPages],
    afterDelete: [revalidateStationPagesDelete],
  },
}
