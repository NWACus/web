import type { ZoneProperties } from '@/services/nac/model/mapLayer'

const toTitleCase = (value: string): string => value.replace(/\b\w/g, (char) => char.toUpperCase())

// Maps a zone's map-layer danger properties to the display values used by the forecast OG image.
export function getDangerBadge(danger: ZoneProperties) {
  // Only 1–5 map to a bundled danger icon; anything else (0, -1, or unexpected) is "No Rating"
  const hasRating = danger.danger_level >= 1 && danger.danger_level <= 5
  const label = danger.danger ? toTitleCase(danger.danger) : hasRating ? '' : 'No Rating'

  return {
    level: hasRating ? String(danger.danger_level) : null,
    label,
    background: danger.color || '#888888',
    foreground: danger.font_color || '#ffffff',
    travelAdvice: danger.travel_advice || null,
    iconFile: hasRating ? `${danger.danger_level}.png` : 'no-rating.png',
  }
}
