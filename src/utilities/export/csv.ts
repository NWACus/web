// A cell a spreadsheet would read as a formula: one starting with =, +, -, @, a tab or a return
const FORMULA_START = /^[=+\-@\t\r]/
// A plain signed or unsigned decimal number, which is safe to leave as it is
const PLAIN_NUMBER = /^[+-]?\d+(\.\d+)?$/

/**
 * Exports can carry visitor-supplied text (a 404's referrer, say), so anything a spreadsheet would
 * evaluate gets a leading apostrophe and opens as text.
 */
function defuseFormula(value: string): string {
  return FORMULA_START.test(value) && !PLAIN_NUMBER.test(value) ? `'${value}` : value
}

// RFC 4180: a cell holding a comma, a quote or a newline is quoted, and its own quotes doubled.
function csvCell(value: string): string {
  const cell = defuseFormula(value)
  return /[",\n\r]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell
}

/** Rows of cells as CSV text, header row first. */
export function toCsv(rows: string[][]): string {
  // Trailing newline: a CSV without one appends to the previous line when files are concatenated.
  return rows.map((cells) => cells.map(csvCell).join(',')).join('\n') + '\n'
}
