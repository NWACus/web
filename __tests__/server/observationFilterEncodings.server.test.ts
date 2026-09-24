/**
 * Inventory row O10: one filter model, two encodings, the same records.
 *
 * The list and stats endpoints take the filters as obs-API query params (`listParams`); the map's
 * vector tiles take the dates in their URL and everything else as a Mapbox GL expression
 * (`tileFilter`). This generates filter sets, applies both encodings to the same records, and
 * requires them to select the same ones.
 *
 * The reference is the API's own list semantics, modelled below from observation-api's
 * `api/core/pagination.py` and `models/observation_view.py` — not the legacy widget, whose two
 * encodings disagreed with each other. The GL side is evaluated by Mapbox's own style-spec
 * evaluator, so an expression that type-errors or coerces unexpectedly fails here as it would on
 * the map.
 *
 * Records are real tile features (decoded from live tiles, filter-relevant properties only) plus
 * generated ones that reach the edges real data rarely does: missing and `D`-prefixed sizes, an
 * elevation of 0, empty-string causes, unknown observer types.
 */
import { featureFilter } from '@mapbox/mapbox-gl-style-spec'
import * as fc from 'fast-check'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import type { ObservationKind } from '@/services/nac/model/observation'
import {
  defaultFilters,
  SIZE_RANGE,
  type ObservationFilters,
} from '@/services/nac/observations/filters'
import {
  avalancheFilterParams,
  observationFilterParams,
} from '@/services/nac/observations/listParams'
import {
  ASPECTS,
  AVALANCHE_PROBLEMS,
  CAUSES,
  IMPACTS,
  OBSERVER_TYPES,
  TRIGGER_GROUPS,
  TRIGGERS,
} from '@/services/nac/observations/options'
import { tileDates, tileFilter } from '@/services/nac/observations/tileFilter'

type Properties = Record<string, unknown>

const CENTER = 'nwac'

function features(name: string): Properties[] {
  const parsed: unknown = JSON.parse(readFileSync(join(__dirname, 'fixtures', name), 'utf8'))
  if (
    parsed &&
    typeof parsed === 'object' &&
    'features' in parsed &&
    Array.isArray(parsed.features)
  )
    return parsed.features
  throw new Error(`${name} has no features`)
}

const REAL = {
  observation: features('obs-tile-observations.json'),
  avalanche: features('obs-tile-avalanches.json'),
}

// ─── The API's list semantics ───────────────────────────────────────────────

const IMPACT_COLUMNS = new Set<string>(IMPACTS.flatMap((impact) => impact.fields))

/** `^[Dd]?\d+(\.\d+)?$`, stripped and cast — the API's d_size range handling. */
function dSizeNumber(value: unknown): number | null {
  if (typeof value !== 'string' || !/^[Dd]?\d+(\.\d+)?$/.test(value)) return null
  return Number(value.replace(/^[Dd]/, ''))
}

const OPS: Record<string, (left: number | string, right: number | string) => boolean> = {
  eq: (l, r) => l === r,
  gt: (l, r) => l > r,
  gte: (l, r) => l >= r,
  lt: (l, r) => l < r,
  lte: (l, r) => l <= r,
}

function compare(op: string, left: unknown, right: string): boolean {
  // SQL: a comparison with NULL is never true.
  if (left === null || left === undefined) return false
  if (typeof left === 'number') return OPS[op](left, Number(right))
  return OPS[op](String(left), right)
}

type ParamTest = (record: Properties, op: string, value: string) => boolean

/** The params `apply_filters` (and the view's hybrid properties) treat specially. */
const SPECIAL_PARAMS: Record<string, ParamTest> = {
  has_instability: (record, _op, value) =>
    value === 'true' && (record.collapsing === true || record.cracking === true),
  has_avalanches_observed: (record, _op, value) =>
    value === 'true' && record.avalanches_observed === true,
  center_id: (record, _op, value) => record.center_id === value.toLowerCase(),
  // `trigger[in]` checks the trigger column and the cause column.
  trigger: (record, _op, value) =>
    value.split(',').includes(String(record.trigger)) ||
    value.split(',').includes(String(record.cause)),
  d_size: (record, op, value) => {
    const size = dSizeNumber(record.d_size)
    return size !== null && compare(op, size, value)
  },
}

/** Whether a record passes one `field[op]=value` param, per `apply_filters`. */
function passesParam(record: Properties, field: string, op: string, value: string): boolean {
  const special = SPECIAL_PARAMS[field]
  if (special) return special(record, op, value)
  if (op === 'in')
    return record[field] !== undefined && value.split(',').includes(String(record[field]))
  return compare(op, record[field], value)
}

/** Every param ANDed, except the impact columns, which the API ORs together. */
function apiSelects(params: URLSearchParams, record: Properties): boolean {
  const impacts: boolean[] = []
  for (const [key, value] of params) {
    const [, field, op = 'eq'] = key.match(/^([^[]+)(?:\[(.+)\])?$/) ?? []
    const passes = passesParam(record, field, op, value)
    if (IMPACT_COLUMNS.has(field)) impacts.push(passes)
    else if (!passes) return false
  }
  return impacts.length === 0 || impacts.some(Boolean)
}

function listSelects(kind: ObservationKind, filters: ObservationFilters, record: Properties) {
  const params =
    kind === 'observation'
      ? observationFilterParams(filters, CENTER)
      : avalancheFilterParams(filters, CENTER)
  return apiSelects(params, record)
}

// ─── The map ────────────────────────────────────────────────────────────────

/** A tile feature carries no property whose value was null. */
function asTileFeature(record: Properties) {
  const properties = Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== null && value !== undefined),
  )
  return { type: 1 as const, properties }
}

function tileSelects(kind: ObservationKind, filters: ObservationFilters, record: Properties) {
  // The tile route filters on its URL's dates (`start_date`/`date` BETWEEN them) …
  const { from, to } = tileDates(filters)
  const date = record[kind === 'observation' ? 'start_date' : 'date']
  if (typeof date !== 'string' || date < from || date > to) return false
  // … and the map applies the rest.
  const filter = featureFilter(tileFilter(kind, filters, CENTER))
  return filter.filter({ zoom: 10 }, asTileFeature(record))
}

// ─── Generators ─────────────────────────────────────────────────────────────

const DATES = ['2025-12-01', '2026-01-10', '2026-01-31', '2026-02-14', '2026-02-28', '2026-03-15']
const ZONES = ['3028', '3029', '3021', '2904', '8c8a0d64-bee2-459f-9e50-24d2b408a810']
const CENTERS = ['nwac', 'snfac', 'btac', 'pac']
const SIZES = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]

/**
 * A filter left at its default most of the time. With every dimension active at once nothing
 * passes any of them, and "both encodings select nothing" would agree vacuously; mostly-off
 * dimensions keep one to three filters active in a typical case, which is what a reader does.
 */
function sometimes<T>(active: fc.Arbitrary<T>, inactive: T): fc.Arbitrary<T> {
  return fc.oneof({ weight: 3, arbitrary: fc.constant(inactive) }, { weight: 1, arbitrary: active })
}
const subset = <T>(values: readonly T[]) =>
  sometimes(fc.subarray([...values], { minLength: 1 }), [])
const flag = () => sometimes(fc.constant(true), false)
const maybe = <T>(arb: fc.Arbitrary<T>) => fc.option(arb, { nil: null })

const filtersArb: fc.Arbitrary<ObservationFilters> = fc
  .record({
    dates: sometimes(fc.tuple(fc.constantFrom(...DATES), fc.constantFrom(...DATES)), [
      DATES[0],
      DATES[DATES.length - 1],
    ]),
    zones: subset(ZONES),
    onlyCenter: flag(),
    observers: subset(OBSERVER_TYPES.map((o) => o.value)),
    instability: flag(),
    avalanchesObserved: flag(),
    triggers: subset(TRIGGER_GROUPS.map((group) => group.label)),
    causes: subset(CAUSES.map((cause) => cause.label)),
    size: sometimes(fc.tuple(fc.constantFrom(...SIZES), fc.constantFrom(...SIZES)), SIZE_RANGE),
    elevationMin: sometimes(fc.constantFrom(0, 1000, 4500, 8000), null),
    elevationMax: sometimes(fc.constantFrom(0, 3000, 6000, 12000), null),
    aspects: subset(ASPECTS),
    problems: subset(AVALANCHE_PROBLEMS),
    impacts: subset(IMPACTS.map((impact) => impact.value)),
  })
  .map(({ dates, size, ...rest }): ObservationFilters => {
    const [from, to] = [...dates].sort()
    const [min, max] = [...size].sort((a, b) => a - b)
    return { ...defaultFilters(to), ...rest, from, to, size: [min, max] }
  })

const observationArb: fc.Arbitrary<Properties> = fc.record({
  id: fc.uuid(),
  center_id: fc.constantFrom(...CENTERS),
  observer_type: fc.constantFrom(...OBSERVER_TYPES.map((o) => o.value), 'volunteer'),
  zone_id: maybe(fc.constantFrom(...ZONES)),
  start_date: fc.constantFrom(...DATES),
  cracking: maybe(fc.boolean()),
  collapsing: maybe(fc.boolean()),
  avalanches_observed: maybe(fc.boolean()),
})

const impactArb = maybe(fc.constantFrom(0, 1, 2))

const avalancheArb: fc.Arbitrary<Properties> = fc.record({
  id: fc.uuid(),
  center_id: fc.constantFrom(...CENTERS),
  observer_type: fc.constantFrom(...OBSERVER_TYPES.map((o) => o.value)),
  zone_id: maybe(fc.constantFrom(...ZONES)),
  date: fc.constantFrom(...DATES),
  trigger: maybe(fc.constantFrom(...TRIGGERS.map((t) => t.value), '')),
  cause: maybe(fc.constantFrom('c', 'u', 'r', 'y', '', 'U')),
  d_size: maybe(
    fc.constantFrom('', '1', '1.5', '2', '2.0', '2.5', '3', '4', '5', 'D2', 'd3.5', 'U'),
  ),
  elevation: maybe(fc.constantFrom(0, 500, 3000, 4500, 7200, 12000)),
  aspect: maybe(fc.constantFrom(...ASPECTS, 'n')),
  avalanche_problem: maybe(fc.constantFrom(...AVALANCHE_PROBLEMS, 'wind slab')),
  ...Object.fromEntries([...IMPACT_COLUMNS].map((column) => [column, impactArb])),
})

// ─── Properties ─────────────────────────────────────────────────────────────

/** How many (filters, record) pairs the list side selected, so a vacuous run is caught. */
const selections = { observation: 0, avalanche: 0 }

function disagreements(kind: ObservationKind, filters: ObservationFilters, records: Properties[]) {
  selections[kind] += records.filter((record) => listSelects(kind, filters, record)).length
  return records
    .filter((record) => listSelects(kind, filters, record) !== tileSelects(kind, filters, record))
    .map((record) => ({ record, list: listSelects(kind, filters, record) }))
}

describe('O10: the list and tile encodings select the same records', () => {
  // Mapbox's evaluator warns on an expression that fails at runtime; none of ours should.
  let warn: jest.SpyInstance
  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => {
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  it.each<ObservationKind>(['observation', 'avalanche'])('over real %s tile features', (kind) => {
    fc.assert(
      fc.property(filtersArb, (filters) => {
        expect(disagreements(kind, filters, REAL[kind])).toEqual([])
      }),
      { numRuns: 300 },
    )
  })

  it('over generated observations', () => {
    fc.assert(
      fc.property(filtersArb, fc.array(observationArb, { maxLength: 30 }), (filters, records) => {
        expect(disagreements('observation', filters, records)).toEqual([])
      }),
      { numRuns: 500 },
    )
  })

  it('over generated avalanches', () => {
    fc.assert(
      fc.property(filtersArb, fc.array(avalancheArb, { maxLength: 30 }), (filters, records) => {
        expect(disagreements('avalanche', filters, records)).toEqual([])
      }),
      { numRuns: 500 },
    )
  })

  it('selected records in the runs above, so their agreement was not vacuous', () => {
    expect(selections.observation).toBeGreaterThan(1000)
    expect(selections.avalanche).toBeGreaterThan(1000)
  })

  it('selects something, so agreement is not vacuous', () => {
    const everything = defaultFilters('2026-03-15')
    const wide = { ...everything, from: '2025-09-01', to: '2026-08-31' }
    expect(REAL.avalanche.filter((r) => tileSelects('avalanche', wide, r)).length).toBeGreaterThan(
      100,
    )
    const narrowed: ObservationFilters = {
      ...wide,
      size: [2, SIZE_RANGE[1]],
      elevationMin: 5000,
      triggers: ['Natural'],
    }
    const selected = REAL.avalanche.filter((r) => listSelects('avalanche', narrowed, r))
    expect(selected.length).toBeGreaterThan(0)
    expect(selected.length).toBeLessThan(REAL.avalanche.length)
  })
})

describe('where the widget’s map disagreed with its own list', () => {
  const base = { ...defaultFilters('2026-03-15'), from: '2026-01-01', to: '2026-03-15' }
  const avalanche = { id: 'a', center_id: 'nwac', date: '2026-02-01', elevation: 0 }

  it('keeps an avalanche with no D-size at the default size range', () => {
    expect(tileSelects('avalanche', base, avalanche)).toBe(true)
    expect(listSelects('avalanche', base, avalanche)).toBe(true)
  })

  it('applies an elevation bound of 0', () => {
    const atLeastZero = { ...base, elevationMax: 0 }
    expect(tileSelects('avalanche', atLeastZero, avalanche)).toBe(true)
    expect(tileSelects('avalanche', atLeastZero, { ...avalanche, elevation: 100 })).toBe(false)
  })

  it('reads a D-prefixed size as the API does', () => {
    const d2up = { ...base, size: [2, 5] satisfies [number, number] }
    expect(tileSelects('avalanche', d2up, { ...avalanche, d_size: 'D2' })).toBe(true)
    expect(listSelects('avalanche', d2up, { ...avalanche, d_size: 'D2' })).toBe(true)
  })
})
