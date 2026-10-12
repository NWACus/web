import type { BlockedRow, CourseImportPlan, RowSummary } from './planCourseImport'

// Next's server-action body limit is raised to 4mb in next.config.js; this leaves headroom
export const MAX_FILE_BYTES = 3_000_000
// Small enough that each confirm call finishes well inside the function's time limit
const BATCH_SIZE = 50

export type ImportSummary = { created: RowSummary[]; skipped: RowSummary[]; blocked: BlockedRow[] }

/** Row numbers to create, in sheet order, split into batches for separate confirm calls. */
export function importBatches(plan: CourseImportPlan, includedDuplicateRows: number[]): number[][] {
  const included = new Set(includedDuplicateRows)
  const rows = [
    ...plan.ready.map((course) => course.row),
    ...plan.likelyDuplicates.map((course) => course.row).filter((row) => included.has(row)),
  ].sort((a, b) => a - b)
  const batches: number[][] = []
  for (let i = 0; i < rows.length; i += BATCH_SIZE) batches.push(rows.slice(i, i + BATCH_SIZE))
  return batches
}

export function importSummary(plan: CourseImportPlan, created: RowSummary[]): ImportSummary {
  const createdRows = new Set(created.map((course) => course.row))
  const summary = ({ row, provider, title, start }: RowSummary) => ({ row, provider, title, start })
  return {
    created,
    skipped: plan.likelyDuplicates.filter((d) => !createdRows.has(d.row)).map(summary),
    blocked: plan.blocked,
  }
}
