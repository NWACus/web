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

// SnowObs owns these fields. The admin shows them read-only and the API refuses
// writes; the sync and the seed go through the local API, which overrides
// field access, so they are the only writers.
const upstreamOwned = { update: () => false }

// One row per SnowObs station. SnowObs is the source of truth for what a
// station *is*, so the identity fields are read-only (seeded from a snapshot
// here; the SnowObs sync that refreshes them is a follow-up); the rest of the
// row is NWAC's decisions about it -- which page shows it, and whether its
// gauge belongs on the precip table.
//
// The public pages never read these rows. They read station names, elevations
// and coordinates from the SnowObs timeseries response, so this table can be
// wiped and reseeded without any page going stale. It exists so admins have a
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
    defaultColumns: ['name', 'stid', 'page', 'elevation', 'hiddenOnPrecipTable', 'lastSyncedAt'],
    useAsTitle: 'name',
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
      // `stid` is unique only within a source; the compound index above holds
      // the real constraint.
      name: 'stid',
      type: 'text',
      required: true,
      index: true,
      access: upstreamOwned,
      admin: { readOnly: true, description: 'SnowObs station id.' },
    },
    {
      name: 'source',
      type: 'text',
      required: true,
      index: true,
      access: upstreamOwned,
      admin: { readOnly: true, description: 'The SnowObs source this station came from.' },
    },
    {
      name: 'name',
      type: 'text',
      access: upstreamOwned,
      admin: { readOnly: true },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'elevation',
          type: 'number',
          access: upstreamOwned,
          admin: { readOnly: true, width: '33%' },
        },
        {
          name: 'latitude',
          type: 'number',
          access: upstreamOwned,
          admin: { readOnly: true, width: '33%' },
        },
        {
          name: 'longitude',
          type: 'number',
          access: upstreamOwned,
          admin: { readOnly: true, width: '33%' },
        },
      ],
    },
    {
      // Who owns the site -- Olympic National Park, USFS, a ski area
      name: 'weatherStationPartner',
      type: 'text',
      label: 'Partner',
      access: upstreamOwned,
      admin: { readOnly: true },
    },
    {
      name: 'lastSyncedAt',
      type: 'date',
      access: upstreamOwned,
      admin: { readOnly: true, position: 'sidebar' },
    },
    contentHashField(),
  ],
  hooks: {
    afterChange: [revalidateStationPages],
    afterDelete: [revalidateStationPagesDelete],
  },
}
