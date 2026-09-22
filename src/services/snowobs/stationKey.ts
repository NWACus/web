// `stid` is unique only within a source, so the pair is the identity everywhere.
// Kept free of the Payload config so client components can import it.
export type StationRef = { stid: string; source: string }

export function stationKey(ref: StationRef): string {
  return `${ref.source}:${ref.stid}`
}

export function parseStationKey(key: string): StationRef | null {
  const i = key.indexOf(':')
  if (i <= 0 || i === key.length - 1) return null
  return { source: key.slice(0, i), stid: key.slice(i + 1) }
}

/**
 * A `source:stid,source:stid` query parameter as references, or the reason it
 * cannot be used. The cap is what keeps a route from proxying SnowObs at will.
 */
export function parseStationKeys(value: string | null, max: number): StationRef[] | string {
  const keys = (value ?? '')
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean)
  if (keys.length === 0 || keys.length > max) return `stations must list 1-${max} entries`
  const stations = keys.map(parseStationKey)
  return stations.every((station) => station !== null)
    ? stations
    : 'stations must be source:stid pairs'
}
