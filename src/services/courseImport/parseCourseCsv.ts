import Papa from 'papaparse'

import type { CourseImportRow } from './planCourseImport'

const BYTE_ORDER_MARK = String.fromCharCode(0xfeff)

/**
 * Rows keyed by header. Multi-line quoted cells (long descriptions) stay one row, and the
 * delimiter is detected, so a tab-separated copy of the sheet parses the same as a CSV export.
 */
export function parseCourseCsv(text: string): {
  headers: string[]
  rows: CourseImportRow[]
  errors: string[]
} {
  // Spreadsheet exports often start with a byte-order mark, which would otherwise glue onto "Title"
  const withoutBom = text.startsWith(BYTE_ORDER_MARK) ? text.slice(1) : text
  const result = Papa.parse<CourseImportRow>(withoutBom, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (header) => header.trim(),
  })
  return {
    headers: result.meta.fields ?? [],
    rows: result.data,
    errors: result.errors.map((error) =>
      error.row === undefined ? error.message : `Row ${error.row + 2}: ${error.message}`,
    ),
  }
}
