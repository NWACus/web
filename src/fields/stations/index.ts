import type { StationRef } from '@/services/snowobs/snowobs'
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

// The stored shape: an ordered list of SnowObs references and nothing else.
export function toStationRefs(value: unknown): StationRef[] {
  return Array.isArray(value) ? value.filter(isStationRef) : []
}

// Well-formed pairs, no repeats. Exported so it can be tested without a form.
export function validateStations(value: unknown): true | string {
  if (value == null) return true
  if (!Array.isArray(value) || !value.every(isStationRef)) {
    return 'Each station needs a SnowObs id and source.'
  }
  const keys = value.map((s) => `${s.source}:${s.stid}`)
  const repeat = keys.find((key, i) => keys.indexOf(key) !== i)
  return repeat ? `${repeat.replace(':', ' ')} is listed twice.` : true
}

// A sensor the list cares about: the admin table gets a column saying whether
// each station reports it, and the picker marks stations that do not.
export type RequiredVariable = { variable: string; label: string }

export type StationsInputClientProps = { requiredVariable?: RequiredVariable }

/**
 * An ordered list of SnowObs stations, picked from what the center tracks.
 * Stored as JSON rather than an array field so the admin can render it as a
 * table with its own add control; the value is only ever `(source, stid)` pairs.
 */
export function stationsField({
  name,
  label,
  description,
  requiredVariable,
}: {
  name: string
  label: string
  description: string
  requiredVariable?: RequiredVariable
}): JSONField {
  const clientProps: StationsInputClientProps = { requiredVariable }
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
    typescriptSchema: [
      () => ({
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
