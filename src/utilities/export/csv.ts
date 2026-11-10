// RFC 4180: a cell holding a comma, a quote or a newline is quoted, and its own quotes doubled.
function csvCell(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

/** Rows of cells as CSV text, header row first. */
export function toCsv(rows: string[][]): string {
  // Trailing newline: a CSV without one appends to the previous line when files are concatenated.
  return rows.map((cells) => cells.map(csvCell).join(',')).join('\n') + '\n'
}
