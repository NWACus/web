// A minute at the CDN, like SnowObs's own cache: readers stay within about two
// minutes of SnowObs while it sees at most one request a minute per URL.
export const STATION_DATA_CACHE_CONTROL = 'public, s-maxage=60, stale-while-revalidate=60'
