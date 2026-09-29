import { isDeadLegacyPath } from './deadLegacyPath'

export type PathHits = { path: string; hits: number }

/** One row of the hand-off list. `to` is null when there is no single obvious destination. */
type SuggestedRedirect = { from: string; to: string | null; hits: number }

type ExclusionReason = 'dead-legacy-path' | 'not-redirectable' | 'probe' | 'live-path'

type ExcludedPath = PathHits & { reason: ExclusionReason }

// Mirrors the middleware matcher's exclusions (/api/..., /favicon.ico): these never reach tenant
// routing, so a Redirects row can't catch them.
const NOT_REDIRECTABLE_PATH =
  /^\/(api|ingest|_next|_static|_vercel|[\w-]+\.\w+|media|thumbnail|assets)/

// Dotfile paths (/.well-known/..., /.env) are browser and scanner probes, not people
const PROBE_PATH = /^\/\./

// Strips a query string or hash, then trailing slashes, which Redirects `from` values can't have
function normalizePath(path: string): string {
  return path.replace(/[?#].*$/, '').replace(/\/+$/, '') || '/'
}

// Last path segment, lowercased and without a .htm/.html extension, for fuzzy matching
function lastSegment(path: string): string | undefined {
  return path
    .split('/')
    .filter(Boolean)
    .pop()
    ?.replace(/\.html?$/i, '')
    .toLowerCase()
}

function exclusionReason(from: string, livePaths: Set<string>): ExclusionReason | null {
  if (isDeadLegacyPath(from)) return 'dead-legacy-path'
  if (NOT_REDIRECTABLE_PATH.test(from)) return 'not-redirectable'
  if (PROBE_PATH.test(from)) return 'probe'
  if (livePaths.has(from)) return 'live-path'
  return null
}

function suggestDestination(from: string, livePaths: Set<string>): string | null {
  const segment = lastSegment(from)
  if (!segment) return null
  const matches = [...livePaths].filter((path) => lastSegment(path) === segment)
  return matches.length === 1 ? matches[0] : null
}

function mergeByNormalizedPath(rows: PathHits[]): PathHits[] {
  const hitsByPath = new Map<string, number>()
  for (const { path, hits } of rows) {
    const from = normalizePath(path)
    hitsByPath.set(from, (hitsByPath.get(from) ?? 0) + hits)
  }
  return [...hitsByPath].map(([path, hits]) => ({ path, hits })).sort((a, b) => b.hits - a.hits)
}

/**
 * Turns 404 paths into suggested redirects, setting aside paths a redirect can't or shouldn't fix.
 * `livePaths` are the center's current URLs, used both to exclude and to suggest destinations.
 */
export function buildNotFoundReport(rows: PathHits[], livePaths: string[]) {
  const live = new Set(livePaths.map(normalizePath))
  const redirects: SuggestedRedirect[] = []
  const excluded: ExcludedPath[] = []

  for (const { path: from, hits } of mergeByNormalizedPath(rows)) {
    const reason = exclusionReason(from, live)
    if (reason) excluded.push({ path: from, hits, reason })
    else redirects.push({ from, to: suggestDestination(from, live), hits })
  }

  return { redirects, excluded }
}

// Captures each <loc> URL in a sitemap or sitemap index
const SITEMAP_LOC = /<loc>\s*([^<\s]+)\s*<\/loc>/g

export function extractSitemapLocs(xml: string): string[] {
  return [...xml.matchAll(SITEMAP_LOC)].map((match) => match[1])
}
