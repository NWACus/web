/**
 * The filter model encoded for the map — the tile half of inventory row O10, `./listParams` being
 * the other.
 *
 * The obs API's vector tiles filter on dates (and optionally center) alone, so only the dates go
 * in the tile URL and everything else becomes a Mapbox GL filter expression over the tile's
 * feature properties. Each clause reproduces what the API does with the matching list param, not
 * what the widget's map did — the widget's two encodings disagreed (at the default size range its
 * map hid avalanches with no D-size, it ignored an elevation of 0, and it never compared an
 * elevation stored as text). The O10 property test evaluates these expressions with Mapbox's own
 * evaluator against the API's list semantics.
 *
 * Every clause guards its types itself (a missing property is simply absent from a tile feature),
 * because a GL filter that throws is evaluated as false *and* logs a warning per feature.
 */
import type { ExpressionSpecification } from 'mapbox-gl'

import type { ObservationKind } from '../model/observation'
import { SIZE_RANGE, type ObservationFilters } from './filters'
import { causeCodes, impactFields, triggerCodes } from './listParams'

type Expression = ExpressionSpecification

function get(key: string): Expression {
  return ['get', key]
}

function isIn(key: string, values: readonly string[]): Expression {
  return ['in', get(key), ['literal', [...values]]]
}

function isTrue(key: string): Expression {
  return ['==', get(key), true]
}

/** A numeric property, only when the tile carries it as a number (the API's column type). */
function numberAtLeast(key: string, min: number): Expression {
  return ['all', ['==', ['typeof', get(key)], 'number'], ['>=', get(key), min]]
}

function numberAtMost(key: string, max: number): Expression {
  return ['all', ['==', ['typeof', get(key)], 'number'], ['<=', get(key), max]]
}

/** `d_size` is text upstream, sometimes with a `D` prefix; the API strips it and casts. */
const D_SIZE_TEXT: Expression = ['to-string', get('d_size')]
const D_SIZE_DIGITS: Expression = [
  'case',
  ['in', ['slice', D_SIZE_TEXT, 0, 1], ['literal', ['D', 'd']]],
  ['slice', D_SIZE_TEXT, 1],
  D_SIZE_TEXT,
]
export const D_SIZE_NUMBER: Expression = ['to-number', D_SIZE_DIGITS, -1]
/** The API's `^[Dd]?\d+(\.\d+)?$` test, as far as GL can express it: present, non-empty, numeric. */
const D_SIZE_VALID: Expression = [
  'all',
  ['has', 'd_size'],
  ['>', ['length', D_SIZE_DIGITS], 0],
  ['>=', D_SIZE_NUMBER, 0],
]

function sizeClause(size: [number, number]): Expression | null {
  const [min, max] = size
  const bounds: Expression[] = []
  if (min > SIZE_RANGE[0]) bounds.push(['>=', D_SIZE_NUMBER, min])
  if (max < SIZE_RANGE[1]) bounds.push(['<=', D_SIZE_NUMBER, max])
  return bounds.length > 0 ? ['all', D_SIZE_VALID, ...bounds] : null
}

function sharedClauses(filters: ObservationFilters, centerId: string): Expression[] {
  const clauses: Expression[] = []
  if (filters.onlyCenter) clauses.push(['==', get('center_id'), centerId.toLowerCase()])
  if (filters.observers.length > 0) clauses.push(isIn('observer_type', filters.observers))
  if (filters.zones.length > 0) clauses.push(isIn('zone_id', filters.zones))
  return clauses
}

function observationClauses(filters: ObservationFilters): Expression[] {
  const clauses: Expression[] = []
  if (filters.instability) clauses.push(['any', isTrue('cracking'), isTrue('collapsing')])
  if (filters.avalanchesObserved) clauses.push(isTrue('avalanches_observed'))
  return clauses
}

function avalancheClauses(filters: ObservationFilters): Expression[] {
  const clauses: Expression[] = []
  const triggers = triggerCodes(filters)
  // `trigger[in]` matches the trigger *or* the cause column upstream.
  if (triggers.length > 0) clauses.push(['any', isIn('trigger', triggers), isIn('cause', triggers)])
  const causes = causeCodes(filters)
  if (causes.length > 0) clauses.push(isIn('cause', causes))
  const size = sizeClause(filters.size)
  if (size) clauses.push(size)
  if (filters.elevationMin !== null) clauses.push(numberAtLeast('elevation', filters.elevationMin))
  if (filters.elevationMax !== null) clauses.push(numberAtMost('elevation', filters.elevationMax))
  if (filters.aspects.length > 0) clauses.push(isIn('aspect', filters.aspects))
  if (filters.problems.length > 0) clauses.push(isIn('avalanche_problem', filters.problems))
  const impacts = impactFields(filters)
  if (impacts.length > 0) {
    clauses.push([
      'any',
      ...impacts.map((field): Expression => ['>', ['to-number', get(field), 0], 0]),
    ])
  }
  return clauses
}

/** The map layer's filter for a tab. Dates are not in it — they are in the tile URL. */
export function tileFilter(
  kind: ObservationKind,
  filters: ObservationFilters,
  centerId: string,
): Expression {
  const clauses = [
    ...sharedClauses(filters, centerId),
    ...(kind === 'observation' ? observationClauses(filters) : avalancheClauses(filters)),
  ]
  return ['all', true, ...clauses]
}

/** The dates the tile URL carries; the API filters tiles on these alone. */
export function tileDates(filters: ObservationFilters): { from: string; to: string } {
  return { from: filters.from, to: filters.to }
}
