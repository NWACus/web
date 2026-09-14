/** The viewer's IANA timezone. Client-only: call it from an effect, never during render. */
export function getBrowserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}
