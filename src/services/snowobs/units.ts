// Readings arrive in the units and rounding each Tracked Variable is configured with in SnowObs;
// AvyWeb neither converts nor re-rounds them. See ADR 021.

/**
 * SnowObs's own `units` values, used as-is from page to API. `default` is the center's configured
 * units, which the station pages label "Imperial".
 */
export type StationUnits = 'default' | 'metric'

/** A `units` param; absent or the earlier `imperial` reads as default, so old links keep working. */
export function parseStationUnits(param: string | null): StationUnits | null {
  if (param === null || param === 'imperial' || param === 'default') return 'default'
  return param === 'metric' ? 'metric' : null
}

// SnowObs's rounding isn't in its response, so read it off the values. Capped so a stray
// float artifact can't turn into a long run of digits.
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

/** A value we derive (a sum or mean), held to the precision of the readings it came from. */
export function roundTo(value: number, decimals: number): number {
  return Number(value.toFixed(decimals))
}

/** A reading as text at its series' precision; a small negative that rounds to "-0" reads as 0. */
export function formatReading(value: number, decimals: number): string {
  const text = value.toFixed(decimals)
  return Number(text) === 0 ? text.replace('-', '') : text
}

const FEET_TO_METERS = 0.3048

// SnowObs reports station elevation in feet whatever `units` asks for.
export function elevationIn(units: StationUnits, feet: number): number {
  return units === 'metric' ? Math.round(feet * FEET_TO_METERS) : feet
}
