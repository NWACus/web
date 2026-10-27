/** What the count line over the list or charts says it counted within. */
export interface CountScope {
  place: string | null
  zoneCount: number
}

export function scopeText({ place, zoneCount }: CountScope): string {
  if (place) return `near ${place}`
  if (zoneCount === 0) return 'within map area'
  return zoneCount === 1 ? 'within selected zone' : 'within selected zones'
}
