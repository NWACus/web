import { waybackUrl, type NotFoundReport } from './notFoundReport'

/** Columns of `redirects.csv`. The redirect importer reads `from` and `to`; the rest is context. */
const COLUMNS = ['from', 'to', 'notes', 'visits', 'archived_page'] as const

// Quotes a field containing a comma, quote or line break, doubling any quotes inside it
function csvField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

/**
 * The redirect candidates as a spreadsheet for center staff to fill in. `to` starts as the
 * suggested destination, if any; `notes` starts empty.
 */
export function toRedirectsCsv(report: NotFoundReport): string {
  const rows = report.redirects.map(({ from, to, hits }) => [
    from,
    to ?? '',
    '',
    String(hits),
    waybackUrl(report, from),
  ])
  return [COLUMNS, ...rows].map((row) => `${row.map(csvField).join(',')}\r\n`).join('')
}
