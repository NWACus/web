/**
 * Sending a dated address for the live product's own date to the live page (Forecast-202).
 *
 * Dated pages are ISR-cached for weeks, and "is this the live product's date?" changes daily, so
 * the page can't decide it when it renders: a cached redirect would keep sending yesterday's
 * address to today's forecast. Instead a page that might be the live product's asks
 * `api/<center>/forecast-current-date/<zone>` when it is viewed, and replaces itself with the live
 * address only if the answer is its own date. The answer is edge-cached for 30 seconds on top of
 * the 30-second fresh read, the same budget as the freshness check.
 */

/** The address a dated page asks for its zone's live product date. The slug is encoded for `&`. */
export function currentForecastDateEndpoint(centerSlug: string, zoneSlug: string): string {
  return `/api/${centerSlug}/forecast-current-date/${encodeURIComponent(zoneSlug)}`
}

/**
 * Whether a dated page has to ask, on view, if its date is the live product's. A date already
 * behind the live product when the page rendered can only fall further behind, so only a page
 * whose date was the live one (or newer, or unknown) asks — most archive pages never do. A retired
 * zone has no live page to go to.
 */
export function mayBeCurrentProductDate(
  date: string,
  renderedCurrentDate: string | null,
  hasLivePage: boolean,
): boolean {
  return hasLivePage && (renderedCurrentDate === null || date >= renderedCurrentDate)
}
