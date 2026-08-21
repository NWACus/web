import { accessByTenantRole } from '@/access/byTenantRole'
import { filterByTenant } from '@/access/filterByTenant'
import { contentHashField } from '@/fields/contentHashField'
import { tenantField } from '@/fields/tenantField'
import { CollectionConfig } from 'payload'

// Acknowledgement state for weather station battery alerts.
//
// A station that goes unhealthy sends one email and is then muted, so a known
// fault doesn't mail every hour while it waits for a repair trip. Clearing
// `alerting` by hand is how a forecaster says "fixed" -- the same workflow as
// Django's "Battery OK" checkbox, which this replaces. Nothing re-enables
// automatically: a battery reading healthy again does not mean anyone has been
// up the mountain.
//
// Rows are created the first time a station alerts, so an empty collection
// means nothing has ever gone wrong.
export const StationAlerts: CollectionConfig = {
  slug: 'stationAlerts',
  access: accessByTenantRole('stationAlerts'),
  admin: {
    baseListFilter: filterByTenant,
    group: 'Weather',
    defaultColumns: ['stationName', 'alerting', 'lastVoltage', 'lastAlertedAt'],
    useAsTitle: 'stationName',
    description:
      'Weather stations that have alerted on battery voltage. Re-check "Alerting" once the station has been repaired to start receiving alerts for it again.',
  },
  fields: [
    tenantField(),
    {
      name: 'stid',
      type: 'text',
      required: true,
      index: true,
      admin: {
        readOnly: true,
        description: 'SnowObs station id.',
      },
    },
    {
      name: 'stationName',
      type: 'text',
      admin: { readOnly: true },
    },
    {
      name: 'alerting',
      type: 'checkbox',
      defaultValue: true,
      index: true,
      label: 'Alerting',
      admin: {
        description:
          'Cleared automatically when an alert is sent. Re-check it once the station is fixed.',
      },
    },
    {
      name: 'lastVoltage',
      type: 'number',
      admin: { readOnly: true, description: 'Voltage that triggered the last alert.' },
    },
    {
      name: 'lastAlertedAt',
      type: 'date',
      admin: { readOnly: true },
    },
    contentHashField(),
  ],
}
