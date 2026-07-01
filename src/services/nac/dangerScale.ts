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

/**
 * Intrinsic pixel dimensions of each danger icon PNG. Icons 3–5 are wider than tall (the cloud /
 * snow spray), so callers must render at the real aspect ratio (fixed height, auto width) rather
 * than a square box, or the diamond looks squished. Reserving these dimensions keeps CLS at zero.
 */
const DANGER_ICON_SIZES: Record<number, { width: number; height: number }> = {
  0: { width: 344, height: 345 },
  1: { width: 201, height: 200 },
  2: { width: 199, height: 200 },
  3: { width: 240, height: 200 },
  4: { width: 278, height: 200 },
  5: { width: 278, height: 200 },
}

/** Intrinsic width/height of the danger icon for a level, for aspect-correct, no-CLS rendering. */
export function dangerIconSize(level: DangerLevel): { width: number; height: number } {
  const clamped = Math.max(0, Math.min(5, level))
  return DANGER_ICON_SIZES[clamped] ?? { width: 200, height: 200 }
}

/**
 * Per-band danger label in the legacy widget's "{level} - {Name}" format, e.g. "4 - High"
 * (and "0 - No Rating"). Mirrors afp's `dangerLevelToText`.
 */
export function dangerLevelLabel(level: DangerLevel): string {
  return `${level} - ${dangerName(level)}`
}

/** Full North American danger-scale URL the legend links out to. */
export const DANGER_SCALE_URL = 'https://avalanche.org/avalanche-encyclopedia/danger-scale/'

/**
 * Explainer for what the elevation bands mean. NWAC-specific for now; when other centers ship
 * native forecasts this should come from per-center config rather than a hardcoded URL.
 */
export const ELEVATION_BANDS_URL = 'https://nwac.us/avalanche-forecasts-elevation-bands/'

/** A row of the North American Public Avalanche Danger Scale, for the legend + its definitions. */
export interface DangerScaleRow {
  level: DangerLevel
  rating: string
  /** Travel advice — contains <strong>, render as sanitized HTML. */
  advice: string
  likelihood: string
  sizeDist: string
}

/** Levels 1–5 of the danger scale (text verbatim from avalanche.org / the legacy widget). */
export const dangerScaleRows: DangerScaleRow[] = [
  {
    level: DangerLevel.Low,
    rating: 'Low',
    advice:
      '<strong>Generally safe avalanche conditions.</strong> Watch for unstable snow on isolated terrain features.',
    likelihood: 'Natural and human-triggered avalanches unlikely.',
    sizeDist: 'Small avalanches in isolated areas or extreme terrain.',
  },
  {
    level: DangerLevel.Moderate,
    rating: 'Moderate',
    advice:
      '<strong>Heightened avalanche conditions on specific terrain features.</strong> Evaluate snow and terrain carefully; identify features of concern.',
    likelihood: 'Natural avalanches unlikely; human-triggered avalanches possible.',
    sizeDist: 'Small avalanches in specific areas; or large avalanches in isolated areas.',
  },
  {
    level: DangerLevel.Considerable,
    rating: 'Considerable',
    advice:
      '<strong>Dangerous avalanche conditions.</strong> Careful snowpack evaluation, cautious route-finding and conservative decision-making essential.',
    likelihood: 'Natural avalanches possible; human-triggered avalanches likely.',
    sizeDist:
      'Small avalanches in many areas; or large avalanches in specific areas; or very large avalanches in isolated areas.',
  },
  {
    level: DangerLevel.High,
    rating: 'High',
    advice:
      '<strong>Very dangerous avalanche conditions.</strong> Travel in avalanche terrain not recommended.',
    likelihood: 'Natural avalanches likely; human-triggered avalanches very likely.',
    sizeDist: 'Large avalanches in many areas; or very large avalanches in specific areas.',
  },
  {
    level: DangerLevel.Extreme,
    rating: 'Extreme',
    advice:
      '<strong>Extraordinarily dangerous avalanche conditions.</strong> Avoid all avalanche terrain.',
    likelihood: 'Natural and human-triggered avalanches certain.',
    sizeDist: 'Very large avalanches in many areas.',
  },
]
