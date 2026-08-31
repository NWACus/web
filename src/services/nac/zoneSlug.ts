/**
 * Forecast-zone slug helpers.
 *
 * Kept out of `nac.ts` deliberately: that module pulls in the Payload config for its logger, which
 * cannot be imported from a client component. The danger map runs in the browser and needs these,
 * so they live in a module with no dependencies at all.
 */

/**
 * The zone slug at the end of a NAC zone URL.
 *
 * Zone URLs are the center's own site, in one of two shapes — `.../avalanche-forecast/#/olympics`
 * from the map layer, `.../forecast/olympics` from center metadata — and both end in the slug.
 */
export function zoneSlugFromUrl(url: string): string | undefined {
  return url.split('/').filter(Boolean).pop()
}

/**
 * The zone slug as the zone list spells it, read from a route param.
 *
 * Next hands a dynamic path segment percent-encoded, so a zone whose name contains `&` — three of
 * Sawtooth's four active zones do — arrives as `soldier-%26-wood-river-valley-mtns` and matches
 * nothing in the zone list, which is built from the center's own zone URLs. Falls back to the raw
 * value for anything that is not valid percent-encoding, which `decodeURIComponent` would throw on.
 */
export function zoneSlugFromParam(param: string): string {
  try {
    return decodeURIComponent(param)
  } catch {
    return param
  }
}

/**
 * The AvyWeb path for a zone, derived from the upstream link.
 *
 * The map layer's `link` points at the avalanche center's *own* website, because the legacy widget
 * was embedded there and "open the forecast" meant staying put. On AvyWeb that same link would
 * throw the reader off the site and past the native forecast page entirely, so a zone belonging to
 * this center is rewritten to its native route. Returns null when the URL carries no slug.
 */
export function nativeZonePath(url: string): string | null {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }

  // The slug sits in the hash on map-layer links (`…/avalanche-forecast/#/olympics`) and in the
  // path on metadata links (`…/forecast/olympics`). Reading it off the parsed URL rather than
  // splitting the raw string matters: a bare center URL like `https://www.nwac.us/` has no
  // segments at all, where a naive split returns the *hostname* and builds a bogus route.
  const segments = (parsed.hash || parsed.pathname)
    .split('/')
    .filter((part) => part && part !== '#')
  const slug = segments.pop()

  return slug ? `/forecasts/avalanche/${slug}` : null
}
