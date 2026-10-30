// Readings come in each center's SnowObs units and rounding, unconverted (ADR 021).

/** SnowObs's `units` values; the pages label `default`, the center's own units, "Imperial". */
export type StationUnits = 'default' | 'metric'

/** A `units` param; absent or the earlier `imperial` reads as default, so old links keep working. */
export function parseStationUnits(param: string | null): StationUnits | null {
  if (param === null || param === 'imperial' || param === 'default') return 'default'
  return param === 'metric' ? 'metric' : null
}

// Capped so a float artifact can't become a long run of digits.
const MAX_DECIMALS = 4

export function seriesDecimals(values: readonly unknown[]): number {
  let decimals = 0
  for (const value of values) {
    if (typeof value !== 'number' || !Number.isFinite(value)) continue
    // The digits after the point in the shortest round-trip form, e.g. "0.03" → 2.
    const fraction = String(value).split('.')[1] ?? ''
    decimals = Math.max(decimals, Math.min(fraction.length, MAX_DECIMALS))
  }
  return decimals
}

// The values alone can't tell a dry week's 0s from whole-number rounding.
export function variableDecimals(
  variable: string,
  values: readonly unknown[],
  rounding: Record<string, number>,
): number {
  return rounding[variable] ?? seriesDecimals(values)
}

export function roundTo(value: number, decimals: number): number {
  return Number(value.toFixed(decimals))
}

// Zero, or a negative rounded to it, reads "0", not "0.00", so a dry hour doesn't look measured.
export function formatReading(value: number, decimals: number): string {
  const text = value.toFixed(decimals)
  return Number(text) === 0 ? '0' : text
}

const FEET_TO_METERS = 0.3048

// SnowObs reports station elevation in feet whatever `units` asks for.
export function elevationIn(units: StationUnits, feet: number): number {
  return units === 'metric' ? Math.round(feet * FEET_TO_METERS) : feet
}
