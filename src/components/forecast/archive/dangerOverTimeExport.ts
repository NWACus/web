/**
 * What a zone's danger-over-time card saves: the chart as a PNG, or its days as a CSV. Both are
 * named for the zone and the charted range, so a reader saving several can tell them apart — the
 * legacy widget's save button wrote a fixed `chart.png`. Pure, so the naming and the CSV text are
 * unit-testable without a canvas or a download.
 */
import { dangerLevelFromRating, dangerName } from '@/services/nac/dangerScale'
import type { DangerOverTimePoint } from '@/services/nac/forecastArchive'

import { chartDays } from './dangerOverTimeOptions'

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
 * The zone's charted days as CSV: every day of the extent in order, an unrated one carrying level
 * 0 and "No Rating" rather than being left out. That mirrors the chart, whose x-axis is every day
 * and whose unrated days are rendered gaps — and it keeps the date column continuous, so the file
 * plots as a series. Every zone spans the same extent, so two zones' files line up row for row.
 *
 * A day with an unrated product and a day with no product at all both read as "No Rating"; the
 * column says whether a danger rating was published, which for both of them is no.
 */
export function dangerCsv(
  points: DangerOverTimePoint[],
  extent: { from: string; to: string },
): string {
  const levelByDate = new Map(points.map((point) => [point.date, point.dangerLevel]))
  const rows = [
    ['date', 'danger_level', 'danger_rating'],
    ...chartDays(extent).map((day) => {
      const level = levelByDate.get(day) ?? 0
      return [day, String(level), dangerName(dangerLevelFromRating(level))]
    }),
  ]

  // Trailing newline: a CSV without one appends to the previous line when files are concatenated.
  return rows.map((cells) => cells.map(csvCell).join(',')).join('\n') + '\n'
}
