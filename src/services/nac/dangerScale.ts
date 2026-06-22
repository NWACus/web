/**
 * Danger scale utility functions.
 * Ported from avy/components/helpers/dangerText.ts and
 * avy/components/AvalancheDangerTriangle.tsx (colorFor).
 */
import { DangerLevel } from './types/forecastSchemas'

/**
 * Coerce a raw numeric `danger_rating` (from the product list endpoint, -1..5) to a
 * DangerLevel. Out-of-range values fall back to None so callers can color safely.
 */
export function dangerLevelFromRating(rating: number): DangerLevel {
  switch (rating) {
    case DangerLevel.GeneralInformation:
      return DangerLevel.GeneralInformation
    case DangerLevel.Low:
      return DangerLevel.Low
    case DangerLevel.Moderate:
      return DangerLevel.Moderate
    case DangerLevel.Considerable:
      return DangerLevel.Considerable
    case DangerLevel.High:
      return DangerLevel.High
    case DangerLevel.Extreme:
      return DangerLevel.Extreme
    case DangerLevel.None:
    default:
      return DangerLevel.None
  }
}

/** Human-readable name for a danger level. */
export function dangerName(level: DangerLevel): string {
  switch (level) {
    case DangerLevel.Extreme:
      return 'Extreme'
    case DangerLevel.High:
      return 'High'
    case DangerLevel.Considerable:
      return 'Considerable'
    case DangerLevel.Moderate:
      return 'Moderate'
    case DangerLevel.Low:
      return 'Low'
    case DangerLevel.None:
    case DangerLevel.GeneralInformation:
    default:
      return 'No Rating'
  }
}

/** Standard avalanche danger scale color (hex) for a danger level. */
export function dangerColor(level: DangerLevel): string {
  switch (level) {
    case DangerLevel.Extreme:
      return '#231f20'
    case DangerLevel.High:
      return '#ed1c24'
    case DangerLevel.Considerable:
      return '#f7941e'
    case DangerLevel.Moderate:
      return '#fff200'
    case DangerLevel.Low:
      return '#50b848'
    case DangerLevel.GeneralInformation:
      return '#6ea4db'
    case DangerLevel.None:
    default:
      return '#939598'
  }
}

/** Text color with sufficient contrast against the danger background color. */
export function dangerTextColor(level: DangerLevel): string {
  switch (level) {
    // Only Extreme has a dark enough background to need white text
    case DangerLevel.Extreme:
      return '#ffffff'
    case DangerLevel.High:
    case DangerLevel.Considerable:
    case DangerLevel.Moderate:
    case DangerLevel.Low:
    case DangerLevel.GeneralInformation:
    case DangerLevel.None:
    default:
      return '#1a1a1a'
  }
}

/** Path to the self-hosted danger icon PNG for a given level. */
export function dangerIconUrl(level: DangerLevel): string {
  // Clamp to 0-5 range for the icon filename
  const clamped = Math.max(0, Math.min(5, level))
  return `/images/danger-icons/${clamped}.png`
}
