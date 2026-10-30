// Readings arrive in the units and rounding each Tracked Variable is configured with in SnowObs;
// AvyWeb neither converts nor re-rounds them. See ADR 021.

export type UnitSystem = 'imperial' | 'metric'

/** A `units` query param; absent means imperial, so URLs from before the param keep working. */
export function parseUnitSystem(param: string | null): UnitSystem | null {
  const units = param ?? 'imperial'
  return units === 'imperial' || units === 'metric' ? units : null
}

/** The SnowObs `units` value for a system: imperial is the center's configured default. */
export function snowObsUnits(system: UnitSystem): 'default' | 'metric' {
  return system === 'metric' ? 'metric' : 'default'
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
export function elevationIn(system: UnitSystem, feet: number): number {
  return system === 'metric' ? Math.round(feet * FEET_TO_METERS) : feet
}
