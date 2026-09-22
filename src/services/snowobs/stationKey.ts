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
