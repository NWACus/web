import type { Course } from '@/payload-types'
import { MAX_FILE_BYTES } from './importBatches'
import { parseCourseCsv } from './parseCourseCsv'
import {
  planCourseImport,
  type CatalogProvider,
  type CourseImportData,
  type CourseImportPlan,
  type ExistingCourse,
  type PlannedCourse,
  type RowSummary,
} from './planCourseImport'

const MAX_ROWS = 2_000

export type PreviewResult = { ok: true; plan: CourseImportPlan } | { ok: false; error: string }
export type BatchResult = { ok: true; created: RowSummary[] } | { ok: false; error: string }

// .xlsx files are zip archives, which start with "PK\x03\x04"
const ZIP_SIGNATURE = 'PK\u0003\u0004'
const EXCEL_FILE = 'This looks like an Excel file. Export it as CSV and upload that instead.'
const MAX_LISTED_PROBLEMS = 20

function listedProblems(problems: string[]): string[] {
  if (problems.length <= MAX_LISTED_PROBLEMS) return problems
  const more = problems.length - MAX_LISTED_PROBLEMS
  return [...problems.slice(0, MAX_LISTED_PROBLEMS), `…and ${more} more.`]
}

const fileProblems = (fileErrors: string[]): PreviewResult => ({
  ok: true,
  plan: { fileErrors, ready: [], blocked: [], likelyDuplicates: [] },
})

const orEmpty = (value: string | null | undefined) => value ?? ''

export function courseToImportData(course: Course): ExistingCourse {
  const { location } = course
  return {
    id: course.id,
    title: course.title,
    subtitle: orEmpty(course.subtitle),
    description: orEmpty(course.description),
    provider: typeof course.provider === 'number' ? course.provider : course.provider.id,
    courseType: course.courseType,
    startDate: course.startDate,
    startDate_tz: course.startDate_tz,
    endDate: orEmpty(course.endDate),
    endDate_tz: course.endDate_tz,
    registrationDeadline: course.registrationDeadline || null,
    registrationDeadline_tz: course.registrationDeadline_tz,
    location: {
      placeName: location.placeName,
      address: orEmpty(location.address),
      city: orEmpty(location.city),
      state: location.state,
      zip: orEmpty(location.zip),
    },
    courseUrl: orEmpty(course.courseUrl),
    modeOfTravel: course.modeOfTravel || [],
    affinityGroups: course.affinityGroups || [],
  }
}

export function planFromCsvText({
  text,
  providers,
  existingCourses,
}: {
  text: unknown
  providers: CatalogProvider[]
  existingCourses: ExistingCourse[]
}): PreviewResult {
  if (typeof text !== 'string' || !text.trim()) return { ok: false, error: 'Choose a CSV file.' }
  if (new TextEncoder().encode(text).length > MAX_FILE_BYTES)
    return { ok: false, error: 'That file is too large.' }

  if (text.startsWith(ZIP_SIGNATURE)) return fileProblems([EXCEL_FILE])

  const { headers, rows, errors } = parseCourseCsv(text)
  if (errors.length) return fileProblems(listedProblems(errors))
  if (rows.length > MAX_ROWS) {
    return { ok: false, error: `A Course Import takes at most ${MAX_ROWS} rows.` }
  }
  return { ok: true, plan: planCourseImport({ headers, rows, providers, existingCourses }) }
}

export function importablePlan(preview: PreviewResult): PreviewResult {
  if (preview.ok && preview.plan.fileErrors.length) {
    return { ok: false, error: preview.plan.fileErrors.join(' ') }
  }
  return preview
}

// Server-action arguments arrive untyped, whatever the signature says
const rowSet = (rows: unknown) => new Set(Array.isArray(rows) ? rows : [])

export function coursesToCreate(
  plan: CourseImportPlan,
  includeDuplicateRows: unknown,
  batchRows: unknown,
) {
  const included = rowSet(includeDuplicateRows)
  const batch = rowSet(batchRows)
  return [
    ...plan.ready,
    ...plan.likelyDuplicates.filter((duplicate) => included.has(duplicate.row)),
  ]
    .filter((course) => batch.has(course.row))
    .sort((a, b) => a.row - b.row)
}

// The database runs without transactions, so a failure removes what this import already created
export async function createAllOrNone({
  courses,
  create,
  remove,
}: {
  courses: PlannedCourse[]
  create: (data: CourseImportData) => Promise<number>
  remove: (ids: number[]) => Promise<void>
}): Promise<{ ok: true; createdIds: number[] } | { ok: false; row: number; message: string }> {
  const createdIds: number[] = []
  for (const course of courses) {
    try {
      createdIds.push(await create(course.data))
    } catch (error) {
      if (createdIds.length) await remove(createdIds)
      return {
        ok: false,
        row: course.row,
        message: error instanceof Error ? error.message : String(error),
      }
    }
  }
  return { ok: true, createdIds }
}
