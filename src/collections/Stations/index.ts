import { accessByTenantRole } from '@/access/byTenantRole'
import { filterByTenant } from '@/access/filterByTenant'
import { contentHashField } from '@/fields/contentHashField'
import { tenantField } from '@/fields/tenantField'
import {
  revalidateStationPages,
  revalidateStationPagesDelete,
} from '@/services/stations/revalidate'
import { getTenantFilter } from '@/utilities/collectionFilters'
import { CollectionConfig } from 'payload'
import { syncStationsNow } from './endpoints/syncStationsNow'

// One row per SnowObs station. SnowObs is the source of truth for what a
// station *is*, so the identity fields are read-only and overwritten by the
// sync; the rest of the row is NWAC's decisions about it -- which page shows
// it, and whether its gauge belongs on the precip table.
//
// The public pages never read these rows. They read station names, elevations
// and coordinates from the SnowObs timeseries response, so this table can be
// wiped and re-synced without any page going stale. It exists so admins have a
// table to make those decisions in.
//
// Rows are per tenant even though a logger can be shared: a second center that
// surfaces NWAC's stations syncs its own copies so that groups and stations stay
// inside one tenant boundary and `getTenantFilter` keeps working on every
// relationship picker.
export const Stations: CollectionConfig = {
  slug: 'stations',
  access: {
    ...accessByTenantRole('stations'),
    // Rows come from SnowObs and nowhere else. Hides "Create New" in the admin
    // and refuses API creates; the update path uses the local API, which
    // bypasses access, so it is unaffected.
    create: () => false,
  },
  admin: {
    baseListFilter: filterByTenant,
    group: 'Weather',
    defaultColumns: ['name', 'stid', 'page', 'elevation', 'hiddenOnPrecipTable', 'lastSyncedAt'],
    useAsTitle: 'name',
    components: {
      // Renders where the collection description normally does: under the
      // title, above the search bar. Carries the description text itself and
      // runs the SnowObs update when the list opens.
      Description: '@/collections/Stations/components/StationsSyncOnOpen#StationsSyncOnOpen',
    },
  },
  defaultSort: 'name',
  indexes: [{ fields: ['tenant', 'source', 'stid'], unique: true }],
  fields: [
    tenantField(),
    {
      name: 'page',
      type: 'relationship',
      relationTo: 'stationPages',
      filterOptions: getTenantFilter,
      admin: {
        description:
          'The page this station appears on. A station with no page is on the site nowhere.',
      },
    },
    {
      name: 'pageOrder',
      type: 'number',
      admin: {
        description:
          'Position among the stations on its page, lowest first. Ties and blanks fall back to elevation, highest first.',
        width: '50%',
      },
    },
    {
      name: 'hiddenOnPrecipTable',
      type: 'checkbox',
      label: 'Hidden on precip table',
      defaultValue: false,
      admin: {
        description:
          'Drop this gauge from the Accumulated Precipitation page while it has a long-term fault. Day-to-day gaps show as "missing" on their own.',
      },
    },
    {
      // `stid` is unique only within a source; the compound index below holds
      // the real constraint, so two syncs at once can't both create a row.
      name: 'stid',
      type: 'text',
      required: true,
      index: true,
      admin: { readOnly: true, description: 'SnowObs station id.' },
    },
    {
      name: 'source',
      type: 'text',
      required: true,
      index: true,
      admin: { readOnly: true, description: 'The SnowObs source this station came from.' },
    },
    {
      name: 'name',
      type: 'text',
      admin: { readOnly: true },
    },
    {
      type: 'row',
      fields: [
        { name: 'elevation', type: 'number', admin: { readOnly: true, width: '33%' } },
        { name: 'latitude', type: 'number', admin: { readOnly: true, width: '33%' } },
        { name: 'longitude', type: 'number', admin: { readOnly: true, width: '33%' } },
      ],
    },
    {
      // Who owns the site -- Olympic National Park, USFS, a ski area
      name: 'weatherStationPartner',
      type: 'text',
      label: 'Partner',
      admin: { readOnly: true },
    },
    {
      name: 'lastSyncedAt',
      type: 'date',
      admin: { readOnly: true, position: 'sidebar' },
    },
    contentHashField(),
  ],
  endpoints: [
    {
      path: '/sync',
      method: 'post',
      handler: syncStationsNow,
    },
  ],
  hooks: {
    afterChange: [revalidateStationPages],
    afterDelete: [revalidateStationPagesDelete],
  },
}
