/**
 * The observation viewer's one filter model (inventory row O10).
 *
 * Everything a reader can narrow the viewer by is one `ObservationFilters` value. It is encoded two
 * ways from here — as obs-API query params for the list (`./listParams`) and as a Mapbox GL
 * expression for the map's vector tiles (`./tileFilter`) — and a property test holds the two to
 * selecting the same records. The legacy widget built each encoding from its own state and they
 * disagree in several places; one model is what makes agreement checkable.
 *
 * The URL form uses the widget's own query keys and encoding (`startDate`, `zone=["…"]`,
 * `trigger=["Human"]`, `sortBy=createdAt`…), so the filters on a legacy `#/view/…?…` link carry
 * over verbatim and a link copied from either viewer opens the same selection in the other. Pure
 * and client-safe: the viewer, the list route and the tests all import it.
 */
import { addDays } from 'date-fns/addDays'
import { differenceInCalendarDays } from 'date-fns/differenceInCalendarDays'
import { format } from 'date-fns/format'
import { isValid } from 'date-fns/isValid'
import { parseISO } from 'date-fns/parseISO'

import { seasonOfDate, seasonWindow } from '../forecastArchive'
import type { ObservationKind } from '../model/observation'
import {
  ASPECTS,
  AVALANCHE_PROBLEMS,
  CAUSES,
  IMPACTS,
  OBSERVER_TYPES,
  TRIGGER_GROUPS,
  type CauseLabel,
  type ImpactValue,
  type TriggerGroup,
} from './options'

export const PAGE_SIZE = 25

/** The size filter's full range, D1–D5 in half steps. */
export const SIZE_RANGE: [number, number] = [1, 5]

/** Days shown when nothing else is asked for — capped at the days since the season began. */
export const DEFAULT_DURATION_DAYS = 14

/** The first season the season select offers, unless the center configures `obs_start_year`. */
export const DEFAULT_START_SEASON = 2023

export type SortBy = 'date' | 'createdAt'
export type SortOrder = 'desc' | 'asc'

export interface ObservationFilters {
  /** Inclusive `yyyy-MM-dd` range, always within one season (Sep 1 – Aug 31). */
  from: string
  to: string
  /** Combined-zone ids (forecast zone ids and obs-zone UUIDs). */
  zones: string[]
  /** "Only {center}": the viewer's own center, rather than everything in the map area. */
  onlyCenter: boolean
  observers: string[]
  /** Observations tab: cracking or collapsing reported. */
  instability: boolean
  /** Observations tab: avalanches observed. */
  avalanchesObserved: boolean
  // ── Avalanches tab ──
  triggers: TriggerGroup[]
  causes: CauseLabel[]
  /** `[min, max]` destructive size; `SIZE_RANGE` is "any size". */
  size: [number, number]
  elevationMin: number | null
  elevationMax: number | null
  aspects: string[]
  problems: string[]
  impacts: ImpactValue[]
}

export interface ListState {
  sortBy: SortBy
  sortOrder: SortOrder
  page: number
}

export const DEFAULT_LIST_STATE: ListState = { sortBy: 'date', sortOrder: 'desc', page: 1 }

// ─── Seasons and dates ──────────────────────────────────────────────────────

function isoDate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

/** A season is named by the year it ends in: 2025-09-01 through 2026-08-31 is season 2026. */
export const seasonOf = seasonOfDate

export function seasonStart(season: number): string {
  return seasonWindow(season).from
}

export function seasonEnd(season: number): string {
  return seasonWindow(season).to
}

/** "Current Season", then "2024-25 Season" and so on, as the widget labels them. */
export function seasonLabel(season: number, currentSeason: number): string {
  if (season === currentSeason) return 'Current Season'
  return `${season - 1}-${String(season).slice(2)} Season`
}

export function seasonOptions(today: string, startSeason: number) {
  const current = seasonOf(today)
  const options: { value: number; label: string }[] = []
  for (let season = current; season >= Math.min(startSeason, current); season -= 1) {
    options.push({ value: season, label: seasonLabel(season, current) })
  }
  return options
}

export function daysBetween(from: string, to: string): number {
  return differenceInCalendarDays(parseISO(to), parseISO(from))
}

export function shiftDate(date: string, days: number): string {
  return isoDate(addDays(parseISO(date), days))
}

/** Days since the current season began; a preset can reach no further back than this. */
export function daysSinceSeasonStart(today: string): number {
  return daysBetween(seasonStart(seasonOf(today)), today)
}

/** The range a viewer opens on: the last two weeks, or the season so far if that is shorter. */
export function defaultRange(today: string): { from: string; to: string } {
  const days = Math.min(DEFAULT_DURATION_DAYS, daysSinceSeasonStart(today))
  return { from: shiftDate(today, -days), to: today }
}

/** A preset ("Past Week") as a range ending today, capped at the season start. */
export function presetRange(today: string, days: number): { from: string; to: string } {
  return { from: shiftDate(today, -Math.min(days, daysSinceSeasonStart(today))), to: today }
}

/**
 * The range a season select lands on. A past season opens whole; the current one opens on the
 * default range. (The widget opened the current season on seven days, not its own default of
 * fourteen — one of the bugs not carried over.)
 */
export function seasonRange(season: number, today: string): { from: string; to: string } {
  if (season >= seasonOf(today)) return defaultRange(today)
  return { from: seasonStart(season), to: seasonEnd(season) }
}

export const DATE_PRESETS = [
  { label: 'Past Day', days: 1 },
  { label: 'Past 3 Days', days: 3 },
  { label: 'Past Week', days: 7 },
  { label: 'Past 2 Weeks', days: 14 },
  { label: 'Past Month', days: 30 },
] as const

/**
 * The preset a range matches, if it ends today — "This Season" being the season so far. The
 * default range reads as "Past 2 Weeks" even when the season is younger than that, as it does in
 * the widget.
 */
export function selectedPreset(filters: Pick<ObservationFilters, 'from' | 'to'>, today: string) {
  if (filters.to !== today) return null
  const days = daysBetween(filters.from, filters.to)
  if (filters.from === defaultRange(today).from) return 'Past 2 Weeks'
  if (days === daysSinceSeasonStart(today)) return 'This Season'
  return DATE_PRESETS.find((preset) => preset.days === days)?.label ?? null
}

export function isDefaultRange(filters: Pick<ObservationFilters, 'from' | 'to'>, today: string) {
  const range = defaultRange(today)
  return filters.from === range.from && filters.to === range.to
}

// ─── Defaults ───────────────────────────────────────────────────────────────

export function defaultFilters(today: string): ObservationFilters {
  return {
    ...defaultRange(today),
    zones: [],
    onlyCenter: false,
    observers: [],
    instability: false,
    avalanchesObserved: false,
    triggers: [],
    causes: [],
    size: SIZE_RANGE,
    elevationMin: null,
    elevationMax: null,
    aspects: [],
    problems: [],
    impacts: [],
  }
}

export function isSizeFiltered(size: [number, number]): boolean {
  return size[0] !== SIZE_RANGE[0] || size[1] !== SIZE_RANGE[1]
}

/** The elevation inputs contradict each other; both encodings still apply them, and match nothing. */
export function hasElevationError(filters: ObservationFilters): boolean {
  return (
    filters.elevationMin !== null &&
    filters.elevationMax !== null &&
    filters.elevationMax < filters.elevationMin
  )
}

// ─── Removable tags ─────────────────────────────────────────────────────────

export type FilterTag =
  | { key: 'dates' }
  | { key: 'zones'; value: string }
  | { key: 'onlyCenter' }
  | { key: 'observers'; value: string }
  | { key: 'instability' }
  | { key: 'avalanchesObserved' }
  | { key: 'triggers'; value: TriggerGroup }
  | { key: 'causes'; value: CauseLabel }
  | { key: 'size' }
  | { key: 'elevation' }
  | { key: 'aspects'; value: string }
  | { key: 'problems'; value: string }
  | { key: 'impacts'; value: ImpactValue }

/**
 * The filters a tab applies, as removable tags in the widget's order. The dates count only when
 * they differ from the default range; the elevation pair is one tag, and none while contradictory.
 */
export function activeTags(
  filters: ObservationFilters,
  kind: ObservationKind,
  today: string,
): FilterTag[] {
  const tags: FilterTag[] = []
  if (!isDefaultRange(filters, today)) tags.push({ key: 'dates' })
  tags.push(...filters.zones.map((value) => ({ key: 'zones' as const, value })))
  if (filters.onlyCenter) tags.push({ key: 'onlyCenter' })
  tags.push(...filters.observers.map((value) => ({ key: 'observers' as const, value })))
  if (kind === 'observation') {
    if (filters.instability) tags.push({ key: 'instability' })
    if (filters.avalanchesObserved) tags.push({ key: 'avalanchesObserved' })
    return tags
  }
  tags.push(...filters.triggers.map((value) => ({ key: 'triggers' as const, value })))
  tags.push(...filters.causes.map((value) => ({ key: 'causes' as const, value })))
  if (isSizeFiltered(filters.size)) tags.push({ key: 'size' })
  const hasElevation = filters.elevationMin !== null || filters.elevationMax !== null
  if (hasElevation && !hasElevationError(filters)) tags.push({ key: 'elevation' })
  tags.push(...filters.aspects.map((value) => ({ key: 'aspects' as const, value })))
  tags.push(...filters.problems.map((value) => ({ key: 'problems' as const, value })))
  tags.push(...filters.impacts.map((value) => ({ key: 'impacts' as const, value })))
  return tags
}

/** The filters with one tag lifted. */
export function removeTag(
  filters: ObservationFilters,
  tag: FilterTag,
  today: string,
): ObservationFilters {
  switch (tag.key) {
    case 'dates':
      return { ...filters, ...defaultRange(today) }
    case 'onlyCenter':
      return { ...filters, onlyCenter: false }
    case 'instability':
      return { ...filters, instability: false }
    case 'avalanchesObserved':
      return { ...filters, avalanchesObserved: false }
    case 'size':
      return { ...filters, size: SIZE_RANGE }
    case 'elevation':
      return { ...filters, elevationMin: null, elevationMax: null }
    default:
      return removeListValue(filters, tag)
  }
}

type ListTag = Extract<FilterTag, { value: string }>

function removeListValue(filters: ObservationFilters, tag: ListTag): ObservationFilters {
  const without = <T extends string>(values: T[]) => values.filter((value) => value !== tag.value)
  switch (tag.key) {
    case 'zones':
      return { ...filters, zones: without(filters.zones) }
    case 'observers':
      return { ...filters, observers: without(filters.observers) }
    case 'triggers':
      return { ...filters, triggers: without(filters.triggers) }
    case 'causes':
      return { ...filters, causes: without(filters.causes) }
    case 'aspects':
      return { ...filters, aspects: without(filters.aspects) }
    case 'problems':
      return { ...filters, problems: without(filters.problems) }
    case 'impacts':
      return { ...filters, impacts: without(filters.impacts) }
  }
}

// ─── URL ────────────────────────────────────────────────────────────────────

/**
 * A widget-style value: JSON when it parses (`["a","b"]`, `true`, `[2,5]`, `"SAC"`), else the raw
 * string. The widget wrote JSON and read either, so both forms are out there.
 */
function parseLoose(raw: string | null): unknown {
  if (raw === null || raw === '') return null
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

/** A list param, as a JSON array or a single bare value. */
function readList(params: URLSearchParams, key: string): string[] {
  const parsed = parseLoose(params.get(key))
  return (Array.isArray(parsed) ? parsed : parsed === null ? [] : [parsed])
    .filter((value) => typeof value === 'string' || typeof value === 'number')
    .map(String)
}

/** A list param kept to the values its filter offers. */
function readChoices<T extends string>(
  params: URLSearchParams,
  key: string,
  allowed: readonly T[],
): T[] {
  return readList(params, key).filter((value): value is T =>
    allowed.some((option) => option === value),
  )
}

function readBoolean(params: URLSearchParams, key: string): boolean {
  return parseLoose(params.get(key)) === true
}

function readNumber(params: URLSearchParams, key: string): number | null {
  const parsed = parseLoose(params.get(key))
  const value = typeof parsed === 'string' ? Number(parsed) : parsed
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function readDate(params: URLSearchParams, key: string): string | null {
  const parsed = parseLoose(params.get(key))
  if (typeof parsed !== 'string') return null
  const date = parseISO(parsed.slice(0, 10))
  return isValid(date) ? isoDate(date) : null
}

function readSize(params: URLSearchParams): [number, number] {
  const parsed = parseLoose(params.get('size'))
  if (!Array.isArray(parsed) || parsed.length !== 2) return SIZE_RANGE
  const [min, max] = parsed.map(Number)
  const valid = (n: number) => Number.isFinite(n) && n >= SIZE_RANGE[0] && n <= SIZE_RANGE[1]
  return valid(min) && valid(max) && min <= max ? [min, max] : SIZE_RANGE
}

/**
 * The range a URL asks for, kept inside one season and no later than today: an end date alone
 * keeps the default span before it, a start before its season's first day is moved up to it (the
 * widget clamps the same way), and a reversed pair falls back to the default.
 */
function readRange(params: URLSearchParams, today: string): { from: string; to: string } {
  const fallback = defaultRange(today)
  const to = readDate(params, 'endDate') ?? fallback.to
  const cappedTo = to > today ? today : to
  const from = readDate(params, 'startDate') ?? fallback.from
  const floor = seasonStart(seasonOf(cappedTo))
  const clampedFrom = from < floor ? floor : from
  return clampedFrom <= cappedTo ? { from: clampedFrom, to: cappedTo } : fallback
}

const TRIGGER_LABELS = TRIGGER_GROUPS.map((group) => group.label)
const CAUSE_VALUES = CAUSES.map((cause) => cause.label)
const IMPACT_VALUES = IMPACTS.map((impact) => impact.value)
const OBSERVER_VALUES = OBSERVER_TYPES.map((observer) => observer.value)

/** The filters a query string asks for, over the defaults; anything unrecognized is dropped. */
export function readFilters(search: string, today: string): ObservationFilters {
  const params = new URLSearchParams(search)
  return {
    ...readRange(params, today),
    zones: readList(params, 'zone'),
    onlyCenter: readList(params, 'center').length > 0,
    observers: readChoices(params, 'observer', OBSERVER_VALUES),
    instability: readBoolean(params, 'instability'),
    avalanchesObserved: readBoolean(params, 'avalancheObs'),
    triggers: readChoices(params, 'trigger', TRIGGER_LABELS),
    causes: readChoices(params, 'cause', CAUSE_VALUES),
    size: readSize(params),
    elevationMin: readNumber(params, 'elevationMin'),
    elevationMax: readNumber(params, 'elevationMax'),
    aspects: readChoices(params, 'aspect', ASPECTS),
    problems: readChoices(params, 'avalancheProblem', AVALANCHE_PROBLEMS),
    impacts: readChoices(params, 'impacts', IMPACT_VALUES),
  }
}

export function readListState(search: string): ListState {
  const params = new URLSearchParams(search)
  const page = Number(params.get('page'))
  return {
    sortBy: params.get('sortBy') === 'createdAt' ? 'createdAt' : 'date',
    sortOrder: params.get('sortOrder') === 'asc' ? 'asc' : 'desc',
    page: Number.isInteger(page) && page > 1 ? page : 1,
  }
}

/** Keys this module owns on the URL; anything else is left alone when writing. */
const FILTER_KEYS = [
  'startDate',
  'endDate',
  'season',
  'zone',
  'center',
  'observer',
  'instability',
  'avalancheObs',
  'trigger',
  'cause',
  'size',
  'elevationMin',
  'elevationMax',
  'aspect',
  'avalancheProblem',
  'impacts',
  'sortBy',
  'sortOrder',
  'page',
]

function setList(params: URLSearchParams, key: string, values: string[]) {
  if (values.length > 0) params.set(key, JSON.stringify(values))
}

/**
 * Write the filters and list state onto a query string, defaults omitted, so an untouched viewer
 * has a clean URL. Both tabs' filters are written whichever tab is showing, so switching tabs
 * keeps the other tab's selection as the widget does.
 */
export function writeFilters(
  search: string,
  filters: ObservationFilters,
  list: ListState,
  context: { today: string; centerId: string },
): string {
  const params = new URLSearchParams(search)
  for (const key of FILTER_KEYS) params.delete(key)

  if (!isDefaultRange(filters, context.today)) {
    params.set('startDate', filters.from)
    params.set('endDate', filters.to)
    params.set('season', String(seasonOf(filters.to)))
  }
  setList(params, 'zone', filters.zones)
  if (filters.onlyCenter) params.set('center', context.centerId.toUpperCase())
  setList(params, 'observer', filters.observers)
  if (filters.instability) params.set('instability', 'true')
  if (filters.avalanchesObserved) params.set('avalancheObs', 'true')
  setList(params, 'trigger', filters.triggers)
  setList(params, 'cause', filters.causes)
  if (isSizeFiltered(filters.size)) params.set('size', JSON.stringify(filters.size))
  if (filters.elevationMin !== null) params.set('elevationMin', String(filters.elevationMin))
  if (filters.elevationMax !== null) params.set('elevationMax', String(filters.elevationMax))
  setList(params, 'aspect', filters.aspects)
  setList(params, 'avalancheProblem', filters.problems)
  setList(params, 'impacts', filters.impacts)
  if (list.sortBy !== DEFAULT_LIST_STATE.sortBy) params.set('sortBy', list.sortBy)
  if (list.sortOrder !== DEFAULT_LIST_STATE.sortOrder) params.set('sortOrder', list.sortOrder)
  if (list.page > 1) params.set('page', String(list.page))

  const query = params.toString()
  return query ? `?${query}` : ''
}
