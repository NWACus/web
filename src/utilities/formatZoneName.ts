// Turns a forecast zone slug into a display name, e.g. "stevens-pass" -> "Stevens Pass"
export function formatZoneName(slug: string): string {
  return slug
    .split('-')
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ')
}
