import { toStationRefs } from '@/fields/stations'
import type { JSONField } from 'payload'

// One table column: a reading from one of the page's stations.
export type StationColumn = { stid: string; variable: string }

function isStationColumn(value: unknown): value is StationColumn {
  return (
    typeof value === 'object' &&
    value !== null &&
    'stid' in value &&
    typeof value.stid === 'string' &&
    value.stid.length > 0 &&
    'variable' in value &&
    typeof value.variable === 'string' &&
    value.variable.length > 0
  )
}

export function toStationColumns(value: unknown): StationColumn[] {
  return Array.isArray(value) ? value.filter(isStationColumn) : []
}

// Well-formed pairs, no repeats, every station on the page. Exported so it can
// be tested without a form.
export function validateColumns(value: unknown, stations: unknown): true | string {
  if (value == null) return true
  if (!Array.isArray(value) || !value.every(isStationColumn)) {
    return 'Each column needs a station id and a reading.'
  }
  const keys = value.map((c) => `${c.stid}:${c.variable}`)
  const repeat = keys.find((key, i) => keys.indexOf(key) !== i)
  if (repeat) return `${repeat.replace(':', ' ')} is listed twice.`
  const onPage = new Set(toStationRefs(stations).map((s) => s.stid))
  const stranger = value.find((c) => !onPage.has(c.stid))
  return stranger ? `Station ${stranger.stid} is not on this page.` : true
}

function siblingValue(siblingData: unknown, key: string): unknown {
  return typeof siblingData === 'object' && siblingData !== null && key in siblingData
    ? Reflect.get(siblingData, key)
    : undefined
}

export type ColumnsInputClientProps = { stationsPath: string }

/**
 * An ordered list of table columns, each a reading from one of the page's
 * stations. Empty means the columns are derived from what the stations
 * report; set, it is exactly what the table shows. Stored as JSON so the
 * admin can render it as a table with its own add control, like the
 * stations field it draws from.
 */
export function columnsField({
  name,
  label,
  description,
  stationsPath = 'stations',
}: {
  name: string
  label: string
  description?: string
  stationsPath?: string
}): JSONField {
  const clientProps: ColumnsInputClientProps = { stationsPath }
  return {
    name,
    type: 'json',
    label,
    defaultValue: [],
    admin: {
      description,
      components: {
        Field: { path: '@/fields/stationColumns/ColumnsInput#ColumnsInput', clientProps },
      },
    },
    typescriptSchema: [
      () => ({
        type: 'array',
        items: {
          type: 'object',
          properties: { stid: { type: 'string' }, variable: { type: 'string' } },
          required: ['stid', 'variable'],
          additionalProperties: false,
        },
      }),
    ],
    validate: (value, { siblingData }) =>
      validateColumns(value, siblingValue(siblingData, stationsPath)),
  }
}
