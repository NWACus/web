/** A center's short name, e.g. "NWAC" or "SNFAC": its tenant slug, uppercased. */
export function centerShortName(centerSlug: string): string {
  return centerSlug.toUpperCase()
}
