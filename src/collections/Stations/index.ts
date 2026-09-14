import { accessByTenantRole } from '@/access/byTenantRole'
import { filterByTenant } from '@/access/filterByTenant'
import { contentHashField } from '@/fields/contentHashField'
import { tenantField } from '@/fields/tenantField'
import { revalidateStationPages, revalidateStationPagesDelete } from '@/services/stations/revalidate'
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
  access: accessByTenantRole('stations'),
  admin: {
    baseListFilter: filterByTenant,
    group: 'Weather',
    defaultColumns: ['name', 'stid', 'group', 'elevation', 'hiddenOnPrecipTable', 'lastSyncedAt'],
    useAsTitle: 'name',
    description:
      'Every station SnowObs holds for this center. Identity is synced and read-only; assign a page and any flags here.',
    components: {
      beforeListTable: ['@/collections/Stations/components/SyncStationsButton#SyncStationsButton'],
    },
  },
  defaultSort: 'name',
  fields: [
    tenantField(),
    {
      name: 'group',
      type: 'relationship',
      relationTo: 'stationGroups',
      filterOptions: getTenantFilter,
      admin: {
        description:
          'The page this station appears on. A station with no page is on the site nowhere.',
      },
    },
    {
      name: 'groupOrder',
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
      // `stid` is unique only within a source, and a second center will bring
      // its own source, so uniqueness is enforced by the sync's upsert rather
      // than a constraint this field cannot express on its own.
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
