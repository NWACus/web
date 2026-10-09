import { TZDate } from '@date-fns/tz'

import { type CourseType, courseTypesData } from '@/constants/courseTypes'
import { affinityGroupOptions } from '@/fields/affinityGroupField'
import { stateOptionsWIntl } from '@/fields/location/states'
import { modeOfTravelOptions } from '@/fields/modeOfTravelField'
import type { Course } from '@/payload-types'
import { TIMEZONE_OPTIONS } from '@/utilities/timezones'
import { isValidFullUrl } from '@/utilities/validateUrl'
import { zipCodeSchema } from '@/utilities/validateZipCode'

/** The columns of A3's catalog sheet, exactly as exported. */
export const COURSE_IMPORT_COLUMNS = [
  'Title',
  'Subtitle',
  'Provider',
  'Course Type',
  'Start Date',
  'Start Time',
  'A3 Time Zone',
  'End Date',
  'End Time',
  'Registration Deadline Date',
  'Registration Deadline Time',
  'Place Name',
  'Street Address',
  'City',
  'State',
  'ZIP Code',
  'Course URL',
  'Mode of Travel',
  'Interest Groups',
  'Description',
] as const

type Column = (typeof COURSE_IMPORT_COLUMNS)[number]
export type CourseImportRow = Partial<Record<string, string>>

export type CatalogProvider = { id: number; name: string; courseTypes: string[] }

type CourseTypeValue = Course['courseType']
type CourseTimeZone = Course['startDate_tz']
type CourseState = Course['location']['state']
type CourseMode = NonNullable<Course['modeOfTravel']>[number]
type CourseAffinityGroup = NonNullable<Course['affinityGroups']>[number]

/** The Course fields an import writes. Existing Courses are compared in this same shape. */
export type CourseImportData = {
  title: string
  subtitle: string
  description: string
  provider: number
  courseType: CourseTypeValue
  startDate: string
  startDate_tz: CourseTimeZone
  endDate: string
  endDate_tz: CourseTimeZone
  registrationDeadline: string | null
  registrationDeadline_tz: CourseTimeZone
  location: { placeName: string; address: string; city: string; state: CourseState; zip: string }
  courseUrl: string
  modeOfTravel: CourseMode[]
  affinityGroups: CourseAffinityGroup[]
}

/** How a sheet row is identified on screen. */
export type RowSummary = { row: number; provider: string; title: string; start: string }
export type PlannedCourse = RowSummary & { data: CourseImportData }
export type BlockedRow = RowSummary & { reasons: string[] }

export type CourseImportPlan = {
  /** Problems with the file itself; when present, no row is checked. */
  fileErrors: string[]
  ready: PlannedCourse[]
  blocked: BlockedRow[]
  likelyDuplicates: PlannedCourse[]
}

/** How a sheet's Provider name is compared: case and runs of whitespace don't matter. */
export const normalizeProviderName = (name: string) =>
  name.trim().replace(/\s+/g, ' ').toLowerCase() // collapse runs of whitespace

/**
 * Label → value for a select field's options. The guard narrows each value to the field's
 * generated type, which is built from these same option lists.
 */
function labelLookup<T extends string>(options: { label: string; value: string }[]) {
  const values = new Set(options.map((option) => option.value))
  const isValue = (value: string): value is T => values.has(value)
  const map = new Map<string, T>()
  for (const option of options) if (isValue(option.value)) map.set(option.label, option.value)
  return map
}

const courseTypeByLabel = new Map(courseTypesData.map((type) => [type.label, type]))
const courseTypeValueByLabel = labelLookup<CourseTypeValue>(courseTypesData)
const stateByLabel = labelLookup<CourseState>(stateOptionsWIntl)
const timezoneByLabel = labelLookup<CourseTimeZone>(TIMEZONE_OPTIONS)
const modeByLabel = labelLookup<CourseMode>(modeOfTravelOptions)
const affinityByLabel = labelLookup<CourseAffinityGroup>(affinityGroupOptions)

// M/D/YYYY, as A3's spreadsheet exports dates
const DATE_PATTERN = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
// h:mm AM/PM, as A3's spreadsheet exports times
const TIME_PATTERN = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i

/** Wall-clock date and time in an IANA zone as a UTC ISO string, or an error message. */
function zonedInstant(
  label: string,
  date: string,
  time: string,
  timeZone: string,
): { iso: string } | { error: string } {
  const dateMatch = DATE_PATTERN.exec(date)
  if (!dateMatch) return { error: `${label} Date "${date}" must look like 1/31/2027.` }
  const timeMatch = TIME_PATTERN.exec(time)
  if (!timeMatch) return { error: `${label} Time "${time}" must look like 8:00 AM.` }

  const [, month, day, year] = dateMatch.map(Number)
  const hour12 = Number(timeMatch[1])
  const minute = Number(timeMatch[2])
  if (hour12 < 1 || hour12 > 12 || minute > 59) {
    return { error: `${label} Time "${time}" is not a real time.` }
  }
  const hour = (hour12 % 12) + (timeMatch[3].toUpperCase() === 'PM' ? 12 : 0)

  const zoned = new TZDate(year, month - 1, day, hour, minute, timeZone)
  if (zoned.getMonth() !== month - 1 || zoned.getDate() !== day) {
    return { error: `${label} Date "${date}" is not a real date.` }
  }
  // TZDate's own toISOString keeps the zone offset; Payload stores and compares UTC
  return { iso: new Date(zoned.getTime()).toISOString() }
}

/** Splits a comma-separated cell into catalog values, collecting any label the catalog lacks. */
function listValues<T extends string>(
  cell: string,
  lookup: Map<string, T>,
  column: Column,
  errors: string[],
) {
  const labels = cell
    .split(',')
    .map((label) => label.trim())
    .filter(Boolean)
  const values: T[] = []
  for (const label of labels) {
    const value = lookup.get(label)
    if (value) values.push(value)
    else errors.push(`${column} "${label}" is not one of: ${[...lookup.keys()].join(', ')}.`)
  }
  return values
}

type Cell = (column: Column) => string

function checkProvider(
  cell: Cell,
  providersByName: Map<string, CatalogProvider[]>,
  reasons: string[],
): CatalogProvider | undefined {
  const name = cell('Provider')
  if (!name) {
    reasons.push('Provider is required.')
    return undefined
  }
  const matches = providersByName.get(normalizeProviderName(name)) ?? []
  if (matches.length === 0) reasons.push(`Provider "${name}" not found.`)
  if (matches.length > 1) reasons.push(`Provider "${name}" matches more than one Provider.`)
  return matches.length === 1 ? matches[0] : undefined
}

function checkTitle(title: string, courseType: CourseType, reasons: string[]) {
  if (!courseType.fullName) {
    reasons.push(
      `Course Type "${courseType.label}" has no title name yet, so its titles can't be checked.`,
    )
    return
  }
  if (!title) return
  // Titles are "<Course Type full name> – <modes>"; only the part before the en dash is checked
  const prefix = title.split(' – ')[0].trim()
  if (prefix !== courseType.fullName) {
    reasons.push(
      `Title starts with "${prefix}", but Course Type ${courseType.label} titles start with "${courseType.fullName}".`,
    )
  }
}

function checkCourseType(
  cell: Cell,
  title: string,
  provider: CatalogProvider | undefined,
  reasons: string[],
): CourseType | undefined {
  const label = cell('Course Type')
  const courseType = courseTypeByLabel.get(label)
  if (!courseType) {
    reasons.push(`Course Type "${label}" is not one of the catalog's Course Types.`)
    return undefined
  }
  if (provider && !provider.courseTypes.includes(courseType.value)) {
    reasons.push(`${provider.name} is not approved to offer ${courseType.label} courses.`)
  }
  checkTitle(title, courseType, reasons)
  return courseType
}

function checkTimeZone(cell: Cell, reasons: string[]): CourseTimeZone | undefined {
  const label = cell('A3 Time Zone')
  const timeZone = timezoneByLabel.get(label)
  if (!label) reasons.push('A3 Time Zone is required.')
  else if (!timeZone)
    reasons.push(`A3 Time Zone "${label}" is not one of the catalog's time zones.`)
  return timeZone
}

function checkDeadline(
  cell: Cell,
  timeZone: string,
  startDate: string | undefined,
  reasons: string[],
): string | null {
  const date = cell('Registration Deadline Date')
  const time = cell('Registration Deadline Time')
  if (!date && !time) return null
  const deadline = zonedInstant('Registration Deadline', date, time, timeZone)
  if ('error' in deadline) {
    reasons.push(deadline.error)
    return null
  }
  if (startDate && deadline.iso >= startDate) {
    reasons.push('Registration Deadline must be before Start.')
    return null
  }
  return deadline.iso
}

function instantOrReason(
  result: { iso: string } | { error: string },
  reasons: string[],
): string | undefined {
  if ('iso' in result) return result.iso
  reasons.push(result.error)
  return undefined
}

function checkTimes(cell: Cell, timeZone: CourseTimeZone | undefined, reasons: string[]) {
  if (!timeZone) return undefined
  const instant = (label: 'Start' | 'End') =>
    instantOrReason(
      zonedInstant(label, cell(`${label} Date`), cell(`${label} Time`), timeZone),
      reasons,
    )
  const startDate = instant('Start')
  const endDate = instant('End')
  const registrationDeadline = checkDeadline(cell, timeZone, startDate, reasons)
  if (!startDate || !endDate) return undefined
  if (endDate <= startDate) {
    reasons.push('End must be after Start.')
    return undefined
  }
  return { timeZone, startDate, endDate, registrationDeadline }
}

function checkLocation(cell: Cell, reasons: string[]) {
  const placeName = cell('Place Name')
  if (!placeName) reasons.push('Place Name is required.')

  const stateLabel = cell('State')
  const state = stateByLabel.get(stateLabel)
  if (!stateLabel) reasons.push('State is required.')
  else if (!state) reasons.push(`State "${stateLabel}" is not a state name or "International".`)

  const zip = cell('ZIP Code')
  if (zip && !zipCodeSchema.safeParse(zip).success) {
    reasons.push(`ZIP Code "${zip}" must be 5 digits or 5+4 format.`)
  }

  if (!placeName || !state) return undefined
  return { placeName, address: cell('Street Address'), city: cell('City'), state, zip }
}

function checkCourseUrl(cell: Cell, reasons: string[]): string {
  const courseUrl = cell('Course URL')
  if (courseUrl && !isValidFullUrl(courseUrl)) {
    reasons.push(`Course URL "${courseUrl}" must be a full http:// or https:// link.`)
  }
  return courseUrl
}

function checkRow(
  row: CourseImportRow,
  providersByName: Map<string, CatalogProvider[]>,
): { data: CourseImportData } | { reasons: string[] } {
  const cell: Cell = (column) => (row[column] ?? '').trim()
  const reasons: string[] = []

  const title = cell('Title')
  if (!title) reasons.push('Title is required.')
  const provider = checkProvider(cell, providersByName, reasons)
  const courseType = checkCourseType(cell, title, provider, reasons)
  const times = checkTimes(cell, checkTimeZone(cell, reasons), reasons)
  const location = checkLocation(cell, reasons)
  const courseUrl = checkCourseUrl(cell, reasons)
  if (!cell('Mode of Travel')) reasons.push('Mode of Travel is required.')
  const modeOfTravel = listValues(cell('Mode of Travel'), modeByLabel, 'Mode of Travel', reasons)
  const affinityGroups = listValues(
    cell('Interest Groups'),
    affinityByLabel,
    'Interest Groups',
    reasons,
  )

  const courseTypeValue = courseType && courseTypeValueByLabel.get(courseType.label)
  if (reasons.length > 0 || !provider || !courseTypeValue || !times || !location) {
    return { reasons }
  }

  return {
    data: {
      title,
      subtitle: cell('Subtitle'),
      description: cell('Description'),
      provider: provider.id,
      courseType: courseTypeValue,
      startDate: times.startDate,
      startDate_tz: times.timeZone,
      endDate: times.endDate,
      endDate_tz: times.timeZone,
      registrationDeadline: times.registrationDeadline,
      registrationDeadline_tz: times.timeZone,
      location,
      courseUrl,
      modeOfTravel,
      affinityGroups,
    },
  }
}

/** Every imported field, in a form where two equal Courses produce the same string. */
export function duplicateKey(course: CourseImportData): string {
  const instant = (iso: string | null) => (iso ? new Date(iso).toISOString() : '')
  return JSON.stringify([
    course.title,
    course.subtitle,
    course.description,
    course.provider,
    course.courseType,
    instant(course.startDate),
    course.startDate_tz,
    instant(course.endDate),
    instant(course.registrationDeadline),
    course.location.placeName,
    course.location.address,
    course.location.city,
    course.location.state,
    course.location.zip,
    course.courseUrl,
    [...course.modeOfTravel].sort(),
    [...course.affinityGroups].sort(),
  ])
}

/**
 * Sorts every sheet row into ready, blocked (with every reason) or likely duplicate, without
 * touching the database. Never corrects or guesses a value: anything that doesn't exactly match
 * the catalog blocks the row.
 */
export function planCourseImport({
  headers,
  rows,
  providers,
  existingCourses,
}: {
  headers: string[]
  rows: CourseImportRow[]
  providers: CatalogProvider[]
  existingCourses: CourseImportData[]
}): CourseImportPlan {
  const plan: CourseImportPlan = { fileErrors: [], ready: [], blocked: [], likelyDuplicates: [] }

  const expected = new Set<string>(COURSE_IMPORT_COLUMNS)
  const present = new Set(headers.map((header) => header.trim()))
  const missing = COURSE_IMPORT_COLUMNS.filter((column) => !present.has(column))
  const unknown = [...present].filter((header) => header && !expected.has(header))
  if (missing.length) plan.fileErrors.push(`Missing columns: ${missing.join(', ')}.`)
  if (unknown.length) plan.fileErrors.push(`Unexpected columns: ${unknown.join(', ')}.`)
  if (plan.fileErrors.length) return plan

  const providersByName = new Map<string, CatalogProvider[]>()
  for (const provider of providers) {
    const key = normalizeProviderName(provider.name)
    providersByName.set(key, [...(providersByName.get(key) ?? []), provider])
  }

  const seen = new Set(existingCourses.map(duplicateKey))
  rows.forEach((row, index) => {
    const summary: RowSummary = {
      // Row 1 of the sheet is the header
      row: index + 2,
      provider: (row.Provider ?? '').trim(),
      title: (row.Title ?? '').trim(),
      start: `${(row['Start Date'] ?? '').trim()} ${(row['Start Time'] ?? '').trim()}`.trim(),
    }
    const result = checkRow(row, providersByName)
    if ('reasons' in result) {
      plan.blocked.push({ ...summary, reasons: result.reasons })
      return
    }
    const key = duplicateKey(result.data)
    if (seen.has(key)) plan.likelyDuplicates.push({ ...summary, data: result.data })
    else plan.ready.push({ ...summary, data: result.data })
    seen.add(key)
  })

  return plan
}
