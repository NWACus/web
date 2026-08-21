import { accessByTenantRole } from '@/access/byTenantRole'
import { filterByTenant } from '@/access/filterByTenant'
import { contentHashField } from '@/fields/contentHashField'
import { tenantField } from '@/fields/tenantField'
import { CollectionConfig } from 'payload'

// One row per physical data logger, synced from SnowObs. Identity is read-only
// because SnowObs owns it -- hand-maintaining this list is what let stid 15 sit
// live upstream and listed nowhere since 2019.
//
// Rows are per tenant even though a logger can be shared: DVAC surfaces NWAC's
// stations from NWAC's source, but syncs its own copies so that groups, rules
// and stations all stay inside one tenant boundary and `getTenantFilter` keeps
// working on every relationship picker.
export const Stations: CollectionConfig = {
  slug: 'stations',
  access: accessByTenantRole('stations'),
  admin: {
    baseListFilter: filterByTenant,
    group: 'Weather',
    defaultColumns: ['name', 'stid', 'elevation', 'weatherStationPartner', 'lastSyncedAt'],
    useAsTitle: 'name',
    description:
      'Data loggers, synced from SnowObs. Identity is read-only -- edit table variables to change what a station contributes.',
  },
  defaultSort: 'name',
  fields: [
    tenantField(),
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
      name: 'tableVariables',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Air temperature', value: 'air_temp' },
        { label: 'Equipment temperature', value: 'equip_temperature' },
        { label: 'Intermittent snow', value: 'intermittent_snow' },
        { label: 'Precipitation (1 hr)', value: 'precip_accum_one_hour' },
        { label: 'Pressure', value: 'pressure' },
        { label: 'Relative humidity', value: 'relative_humidity' },
        { label: 'Snow depth (24 hr)', value: 'snow_depth_24h' },
        { label: 'Snow depth', value: 'snow_depth' },
        { label: 'Solar radiation', value: 'solar_radiation' },
        { label: 'Wind direction', value: 'wind_direction' },
        { label: 'Wind gust', value: 'wind_gust' },
        { label: 'Wind speed (min)', value: 'wind_speed_min' },
        { label: 'Wind speed', value: 'wind_speed' },
      ],
      admin: {
        description:
          'Table columns for this station. Order is fixed across the site, so only the selection is per-station.',
      },
    },
    {
      name: 'lastSyncedAt',
      type: 'date',
      admin: { readOnly: true, position: 'sidebar' },
    },
    contentHashField(),
  ],
}
