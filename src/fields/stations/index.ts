import type { StationRef } from '@/services/snowobs/snowobs'
import type { StationEntry } from '@/services/stations/stationColumns'
import type { JSONField } from 'payload'

function isStationRef(value: unknown): value is StationRef {
  return (
    typeof value === 'object' &&
    value !== null &&
    'stid' in value &&
    typeof value.stid === 'string' &&
    value.stid.length > 0 &&
    'source' in value &&
    typeof value.source === 'string' &&
    value.source.length > 0
  )
}

function isColumnList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string')
}

function readingChoice(entry: StationRef): Pick<StationEntry, 'columns' | 'hidden'> {
  const columns = 'columns' in entry ? entry.columns : undefined
  if (isColumnList(columns)) return { columns }
  const hidden = 'hidden' in entry ? entry.hidden : undefined
  return isColumnList(hidden) ? { hidden } : {}
}

// The stored shape: an ordered list of SnowObs references, each with the
// readings a station page chose to show or hide for it.
export function toStationEntries(value: unknown): StationEntry[] {
  return Array.isArray(value)
    ? value
        .filter(isStationRef)
        .map((entry) => ({ stid: entry.stid, source: entry.source, ...readingChoice(entry) }))
    : []
}

export function toStationRefs(value: unknown): StationRef[] {
  return toStationEntries(value).map(({ stid, source }) => ({ stid, source }))
}

// Well-formed pairs, no repeats. Exported so it can be tested without a form.
export function validateStations(value: unknown): true | string {
  if (value == null) return true
  if (!Array.isArray(value) || !value.every(isStationRef)) {
    return 'Each station needs a SnowObs id and source.'
  }
  const badList = (s: StationRef) =>
    ('columns' in s && !isColumnList(s.columns)) || ('hidden' in s && !isColumnList(s.hidden))
  if (value.some(badList)) {
    return "A station's shown or hidden readings must be a list of readings."
  }
  const keys = value.map((s) => `${s.source}:${s.stid}`)
  const repeat = keys.find((key, i) => keys.indexOf(key) !== i)
  return repeat ? `${repeat.replace(':', ' ')} is listed twice.` : true
}

// A sensor the list cares about: the admin table gets a column saying whether
// each station reports it, and the picker marks stations that do not.
export type RequiredVariable = { variable: string; label: string }

export type StationsInputClientProps = {
  requiredVariable?: RequiredVariable
  /** Let each station choose which of its readings the station page's table shows. */
  perStationColumns?: boolean
}

/**
 * An ordered list of SnowObs stations, picked from what the center tracks.
 * Stored as JSON rather than an array field so the admin can render it as a
 * table with its own add control; the value is only ever `(source, stid)` pairs,
 * plus a station's chosen `columns` when `perStationColumns` is on.
 */
export function stationsField({
  name,
  label,
  description,
  requiredVariable,
  perStationColumns,
}: {
  name: string
  label: string
  description?: string
  requiredVariable?: RequiredVariable
  perStationColumns?: boolean
}): JSONField {
  const clientProps: StationsInputClientProps = { requiredVariable, perStationColumns }
  return {
    name,
    type: 'json',
    label,
    defaultValue: [],
    admin: {
      description,
      components: {
        Field: { path: '@/fields/stations/StationsInput#StationsInput', clientProps },
      },
    },
    // Separate branches so each schema literal is checked against Payload's JSON Schema type.
    typescriptSchema: [
      perStationColumns
        ? () => ({
            type: 'array',
            items: {
              type: 'object',
              properties: {
                stid: { type: 'string' },
                source: { type: 'string' },
                columns: { type: 'array', items: { type: 'string' } },
                hidden: { type: 'array', items: { type: 'string' } },
              },
              required: ['stid', 'source'],
              additionalProperties: false,
            },
          })
        : () => ({
            type: 'array',
            items: {
              type: 'object',
              properties: { stid: { type: 'string' }, source: { type: 'string' } },
              required: ['stid', 'source'],
              additionalProperties: false,
            },
          }),
    ],
    validate: (value) => validateStations(value),
  }
}
