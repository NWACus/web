import type { RequiredDataFromCollectionSlug } from 'payload'

import { courseTypesData } from '@/constants/courseTypes'
import { stateOptionsWIntl } from '@/fields/location/states'
import type { Provider } from '@/payload-types'
import { parseCourseCsv } from './parseCourseCsv'
import { normalizeProviderName } from './planCourseImport'

type ProviderState = NonNullable<NonNullable<Provider['location']>['state']>
type ProviderCourseType = Provider['courseTypes'][number]
type ProviderData = RequiredDataFromCollectionSlug<'providers'>

/** A database row as the libSQL client returns it. */
export type SourceRow = Record<string, unknown>

const stateValues = new Set(stateOptionsWIntl.map((option) => option.value))
const courseTypeValues = new Set(courseTypesData.map((type) => type.value))
const isState = (value: unknown): value is ProviderState =>
  typeof value === 'string' && stateValues.has(value)
const isCourseType = (value: unknown): value is ProviderCourseType =>
  typeof value === 'string' && courseTypeValues.has(value)
const text = (value: unknown) => (typeof value === 'string' ? value : null)

function valuesByParent(rows: SourceRow[]): Map<unknown, unknown[]> {
  const map = new Map<unknown, unknown[]>()
  for (const row of rows) map.set(row.parent_id, [...(map.get(row.parent_id) ?? []), row.value])
  return map
}

function toProviderData(
  row: SourceRow,
  courseTypes: unknown[],
  states: unknown[],
): ProviderData | null {
  const name = text(row.name)
  if (!name) return null
  return {
    name,
    // A blank slug is regenerated from the name by the slug field
    slug: text(row.slug) ?? '',
    details: text(row.details),
    email: text(row.email),
    phone: text(row.phone),
    website: text(row.website),
    location: {
      address: text(row.location_address),
      city: text(row.location_city),
      state: isState(row.location_state) ? row.location_state : null,
      zip: text(row.location_zip),
    },
    statesServiced: states.filter(isState),
    courseTypes: courseTypes.filter(isCourseType),
    _status: 'published',
  }
}

/** Provider documents from the source's `providers` table and its two select-list tables. */
export function sourceProviders(tables: {
  providers: SourceRow[]
  courseTypes: SourceRow[]
  statesServiced: SourceRow[]
}): ProviderData[] {
  const types = valuesByParent(tables.courseTypes)
  const states = valuesByParent(tables.statesServiced)
  return tables.providers.flatMap((row) => {
    const data = toProviderData(row, types.get(row.id) ?? [], states.get(row.id) ?? [])
    return data ? [data] : []
  })
}

function droppedFor(
  label: string,
  row: SourceRow,
  courseTypes: unknown[],
  states: unknown[],
): string[] {
  const state = row.location_state
  return [
    ...courseTypes.filter((v) => !isCourseType(v)).map((v) => `${label}: Course Type "${v}"`),
    ...states.filter((v) => !isState(v)).map((v) => `${label}: state serviced "${v}"`),
    ...(state != null && state !== '' && !isState(state)
      ? [`${label}: location state "${state}"`]
      : []),
  ]
}

/**
 * Every source value the copy leaves out because the app doesn't know it, so nothing disappears
 * silently: unknown Course Types and states, and Providers with no name.
 */
export function droppedSourceValues(tables: {
  providers: SourceRow[]
  courseTypes: SourceRow[]
  statesServiced: SourceRow[]
}): string[] {
  const types = valuesByParent(tables.courseTypes)
  const states = valuesByParent(tables.statesServiced)
  return tables.providers.flatMap((row) => {
    const name = text(row.name)
    if (!name) return [`Provider ${String(row.id)}: no name, so the whole Provider`]
    return droppedFor(name, row, types.get(row.id) ?? [], states.get(row.id) ?? [])
  })
}

export type ProviderMatch = { data: ProviderData; localId: number | undefined }

/** Pairs each source Provider with the local Provider of the same name, if there is one. */
export function matchLocalProviders(
  source: ProviderData[],
  local: { id: number; name: string }[],
): ProviderMatch[] {
  const localIdByName = new Map(local.map((p) => [normalizeProviderName(p.name), p.id]))
  return source.map((data) => ({
    data,
    localId: localIdByName.get(normalizeProviderName(data.name)),
  }))
}

/** What the script reports for one Provider. */
export function syncLine({ data, localId }: ProviderMatch, dryRun: boolean): string {
  return `${dryRun ? '[dry run] ' : ''}${localId ? 'Update' : 'Create'} ${data.name}`
}

/** The sheet's Provider names with no source Provider, each listed once. */
export function unmatchedSheetProviders(source: ProviderData[], sheetText: string): string[] {
  const known = new Set(source.map((p) => normalizeProviderName(p.name)))
  const sheetNames = new Map<string, string>()
  for (const row of parseCourseCsv(sheetText).rows) {
    const name = (row.Provider ?? '').trim()
    if (name) sheetNames.set(normalizeProviderName(name), name)
  }
  return [...sheetNames].filter(([key]) => !known.has(key)).map(([, name]) => name)
}
