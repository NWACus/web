import { stationsField } from '@/fields/stations'
import { PRECIP_HOURLY } from '@/services/snowobs/constants'
import { ALL_PRECIP_COLUMNS, PRECIP_COLUMNS } from '@/services/stations/precipColumns'
import type { Block } from 'payload'

// The Accumulated Precipitation table on a Payload page: which columns it
// shows and, in table order, which SnowObs gauges. The stations are read live
// from SnowObs at render, so the block stores only references.
export const PrecipTableBlock: Block = {
  slug: 'precipTable',
  interfaceName: 'PrecipTableBlock',
  labels: { singular: 'Precipitation Table', plural: 'Precipitation Tables' },
  fields: [
    {
      name: 'columns',
      type: 'select',
      hasMany: true,
      options: [...PRECIP_COLUMNS],
      defaultValue: ALL_PRECIP_COLUMNS,
      admin: {
        description:
          'Which columns the table shows after the station name. Clearing every column shows them all.',
      },
    },
    stationsField({
      name: 'stations',
      label: 'Stations',
      description:
        'The table shows these stations in this order. Drag to reorder. Day-to-day gaps show as "missing" on their own.',
      requiredVariable: { variable: PRECIP_HOURLY, label: 'Precip' },
    }),
  ],
}
