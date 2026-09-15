/**
 * What a zone's danger-over-time card saves: the chart as a PNG, or its days as a CSV. Both are
 * named for the zone and the charted range, so a reader saving several can tell them apart — the
 * legacy widget's save button wrote a fixed `chart.png`. Pure, so the naming and the CSV text are
 * unit-testable without a canvas or a download.
 */
import { dangerLevelFromRating, dangerName } from '@/services/nac/dangerScale'
import type { DangerOverTimePoint } from '@/services/nac/forecastArchive'

/** The name a zone's export saves under, e.g. `olympics-danger-over-time-2026-04-03-to-2026-04-07.csv`. */
export function dangerExportFilename(
  zoneSlug: string,
  extent: { from: string; to: string },
  extension: 'png' | 'csv',
): string {
  return `${zoneSlug}-danger-over-time-${extent.from}-to-${extent.to}.${extension}`
}

// RFC 4180: a cell holding a comma, a quote or a newline is quoted, and its own quotes doubled.
function csvCell(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

/**
 * The zone's charted days as CSV, one row per rated day in chart order. Only the rated days, so
 * the file says exactly what the bars say: a day missing here is a day the chart leaves as a gap.
 */
export function dangerCsv(points: DangerOverTimePoint[]): string {
  const rows = [
    ['date', 'danger_level', 'danger_rating'],
    ...points.map((point) => [
      point.date,
      String(point.dangerLevel),
      dangerName(dangerLevelFromRating(point.dangerLevel)),
    ]),
  ]

  // Trailing newline: a CSV without one appends to the previous line when files are concatenated.
  return rows.map((cells) => cells.map(csvCell).join(',')).join('\n') + '\n'
}
