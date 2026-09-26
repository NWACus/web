/**
 * The viewer's IANA timezone. Client-only: read it through `useViewerTimezone` or from an effect,
 * never directly during render.
 */
export function getBrowserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}
