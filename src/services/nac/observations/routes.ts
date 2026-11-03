/**
 * The observation viewer's addresses: which tab and which record a path means, and where a legacy
 * widget hash link lands. Pure, so the viewer, the pages and the tests share one reading.
 *
 * The native viewer lives at the addresses the widget pages already had: `/observations` is the
 * observations tab, `/observations/avalanches` the avalanches tab, and a record is
 * `/observations/<id>` or `/observations/avalanches/<id>` — opened as a modal over the list when a
 * reader clicks into it, and as a full page when that address is loaded directly.
 */
import type { ObservationKind } from '../model/observation'

/** The obs API's ids are UUIDs; anything else makes it answer 500 rather than 204. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isObservationId(id: string): boolean {
  return UUID.test(id)
}

export const OBSERVATIONS_PATH = '/observations'
export const AVALANCHES_PATH = '/observations/avalanches'

export function tabPath(kind: ObservationKind): string {
  return kind === 'observation' ? OBSERVATIONS_PATH : AVALANCHES_PATH
}

export function detailPath(kind: ObservationKind, id: string): string {
  return `${tabPath(kind)}/${id}`
}

export interface ViewerLocation {
  /** Anything before `/observations` — the tenant segment on a path-routed host, else empty. */
  prefix: string
  tab: ObservationKind
  /** The record open over the list, if any. */
  detail: { kind: ObservationKind; id: string } | null
}

/**
 * What a viewer path shows, or null for a path that isn't one of the viewer's. The tenant may or
 * may not lead the path (`/nwac/observations` locally, `/observations` on a tenant's own host), so
 * the match is on the suffix. An open record keeps its own tab underneath it.
 */
export function readViewerPath(pathname: string): ViewerLocation | null {
  // `<prefix>/observations`, then optionally `/avalanches`, then optionally `/<id>`.
  const match = pathname.match(/^(.*?)\/observations(\/avalanches)?(?:\/([^/]+))?\/?$/)
  if (!match) return null
  const [, prefix, avalanches, id] = match
  const tab: ObservationKind = avalanches ? 'avalanche' : 'observation'
  if (!id) return { prefix, tab, detail: null }
  if (!isObservationId(id)) return null
  return { prefix, tab, detail: { kind: tab, id } }
}

/**
 * Where a legacy widget hash link lands. Centers published the widget's addresses upstream
 * (`obs_view_url` is `…/observations/#/view/observations` for some), and a hash never reaches the
 * server, so this runs in the browser. The widget's filters rode in the hash's own query string
 * with the same keys the native viewer reads, so they carry over as they are.
 *
 * Returns the tenant-relative path and query, or null when the hash is not a widget route.
 */
export function legacyHashTarget(hash: string): string | null {
  // `#/<route>?<query>`: split the widget route from its query string.
  const match = hash.match(/^#\/([^?]*)(\?.*)?$/)
  if (!match) return null
  const [, route, query = ''] = match
  const parts = route.split('/').filter(Boolean)
  const [first, second, third] = parts

  if (first === 'view') {
    // `visual` is the charts view, not built natively yet; its filters are the avalanches tab's.
    const kind: ObservationKind = second === 'observations' || !second ? 'observation' : 'avalanche'
    if (third && isObservationId(third)) return detailPath(kind, third)
    return `${tabPath(kind)}${query}`
  }
  if ((first === 'observation' || first === 'avalanche') && second && isObservationId(second)) {
    return detailPath(first, second)
  }
  if (first === 'form' || first === 'advanced-form' || first === 'submit') {
    return `${OBSERVATIONS_PATH}/submit`
  }
  return null
}
