/**
 * How a weather cell's value and its row's unit are typeset together.
 *
 * NAC sends the value as free text a forecaster typed ("20 to 25", "Overcast", "6.0 / 0.36") and
 * the unit as a separate field on the row, so a unit can only be threaded into the numbers when the
 * whole value is a number or a simple numeric range. Everything else keeps the unit trailing the
 * value, which is what the legacy widget does for every cell.
 */

/** Units that read as a symbol on each number, and what (if anything) still trails the value. */
const TIGHT_UNITS: Record<string, { symbol: string; trailing: string | null }> = {
  '"': { symbol: '"', trailing: null },
  '”': { symbol: '"', trailing: null },
  '%': { symbol: '%', trailing: null },
  // The wire carries the scale letter alone; the degree sign is ours, and the letter still trails.
  F: { symbol: '°', trailing: 'F' },
  C: { symbol: '°', trailing: 'C' },
  '°F': { symbol: '°', trailing: 'F' },
  '°C': { symbol: '°', trailing: 'C' },
}

const NUMBER = String.raw`-?\d+(?:\.\d+)?`

/** A bare number, or two joined by "to" or a dash — the only shapes a unit can be threaded into. */
const NUMERIC_VALUE = new RegExp(`^(${NUMBER})(?:(\\s*(?:to|-|–|—)\\s*)(${NUMBER}))?$`)

export interface TypesetWeatherValue {
  /** The value to print, with any tight unit symbol threaded in. */
  value: string
  /** The unit to print after the value in muted type, or null when nothing trails it. */
  trailingUnit: string | null
}

export function typesetWeatherValue(
  value: string | null | undefined,
  unit: string | null | undefined,
): TypesetWeatherValue {
  const text = value ?? ''
  // A blank or placeholder cell carries no unit, matching the widget.
  if (text === '' || text === '-' || !unit) return { value: text, trailingUnit: null }

  const tight = TIGHT_UNITS[unit.trim()]
  if (!tight) return { value: text, trailingUnit: unit }

  const numeric = NUMERIC_VALUE.exec(text.trim())
  if (!numeric) return { value: text, trailingUnit: unit }

  const [, low, separator, high] = numeric
  return {
    value: high
      ? `${low}${tight.symbol}${separator}${high}${tight.symbol}`
      : `${low}${tight.symbol}`,
    trailingUnit: tight.trailing,
  }
}
