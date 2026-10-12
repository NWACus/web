import type { Course } from '@/payload-types'
import { parseCourseCsv } from './parseCourseCsv'
import {
  planCourseImport,
  type BlockedRow,
  type CatalogProvider,
  type CourseImportData,
  type CourseImportPlan,
  type PlannedCourse,
  type RowSummary,
} from './planCourseImport'

const MAX_FILE_CHARACTERS = 5_000_000
const MAX_ROWS = 2_000

export type PreviewResult = { ok: true; plan: CourseImportPlan } | { ok: false; error: string }
/** What an import did, row by row, for the summary screen. */
export type ImportSummary = { created: RowSummary[]; skipped: RowSummary[]; blocked: BlockedRow[] }
export type ImportResult = ({ ok: true } & ImportSummary) | { ok: false; error: string }

// .xlsx files are zip archives, which start with "PK\x03\x04"
const ZIP_SIGNATURE = 'PK\u0003\u0004'
const EXCEL_FILE = 'This looks like an Excel file. Export it as CSV and upload that instead.'
const MAX_LISTED_PROBLEMS = 20

/** Every problem up to a limit, so a sheet with many broken rows can be fixed in one pass. */
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

/** An existing Course in the shape the duplicate check compares rows against. */
export function courseToImportData(course: Course): CourseImportData {
  const { location } = course
  return {
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

/** Parses the uploaded text and plans it against the catalog, refusing unreadable or huge files. */
export function planFromCsvText({
  text,
  providers,
  existingCourses,
}: {
  text: unknown
  providers: CatalogProvider[]
  existingCourses: CourseImportData[]
}): PreviewResult {
  if (typeof text !== 'string' || !text.trim()) return { ok: false, error: 'Choose a CSV file.' }
  if (text.length > MAX_FILE_CHARACTERS) return { ok: false, error: 'That file is too large.' }

  if (text.startsWith(ZIP_SIGNATURE)) return fileProblems([EXCEL_FILE])

  const { headers, rows, errors } = parseCourseCsv(text)
  if (errors.length) return fileProblems(listedProblems(errors))
  if (rows.length > MAX_ROWS) {
    return { ok: false, error: `A Course Import takes at most ${MAX_ROWS} rows.` }
  }
  return { ok: true, plan: planCourseImport({ headers, rows, providers, existingCourses }) }
}

/** A plan the import can act on: problems with the file itself stop the whole import. */
export function importablePlan(preview: PreviewResult): PreviewResult {
  if (preview.ok && preview.plan.fileErrors.length) {
    return { ok: false, error: preview.plan.fileErrors.join(' ') }
  }
  return preview
}

/** The ready rows plus the likely duplicates the Provider Manager ticked, in sheet order. */
export function coursesToCreate(plan: CourseImportPlan, includeDuplicateRows: unknown) {
  const included = new Set(Array.isArray(includeDuplicateRows) ? includeDuplicateRows : [])
  return [
    ...plan.ready,
    ...plan.likelyDuplicates.filter((duplicate) => included.has(duplicate.row)),
  ].sort((a, b) => a.row - b.row)
}

const summary = ({ row, provider, title, start }: RowSummary): RowSummary => ({
  row,
  provider,
  title,
  start,
})

/** The rows an import created, the likely duplicates it skipped, and the rows it couldn't take. */
export function importSummary(plan: CourseImportPlan, created: PlannedCourse[]): ImportSummary {
  const createdRows = new Set(created.map((course) => course.row))
  return {
    created: created.map(summary),
    skipped: plan.likelyDuplicates.filter((d) => !createdRows.has(d.row)).map(summary),
    blocked: plan.blocked,
  }
}

/**
 * Creates each Course in order. The database adapter runs without transactions, so if one fails
 * the Courses already created by this import are removed instead of leaving the catalog
 * half-imported.
 */
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
