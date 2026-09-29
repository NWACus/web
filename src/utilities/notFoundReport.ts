import { z } from 'zod'
import { isDeadLegacyPath } from './deadLegacyPath'

const EXCLUSION_REASONS = ['dead-legacy-path', 'not-redirectable', 'probe', 'live-path'] as const

const pathHitsSchema = z.object({ path: z.string(), hits: z.number() })
const nameHitsSchema = z.object({ name: z.string(), hits: z.number() })

/** The `report.json` written by `pnpm report:404s`, which the CSV and HTML are rendered from. */
export const notFoundReportSchema = z.object({
  tenant: z.string(),
  centerName: z.string(),
  domain: z.string(),
  hostnames: z.array(z.string()),
  range: z.object({ start: z.string(), end: z.string() }),
  totals: z.object({ notFound: z.number(), notFoundNonBot: z.number() }),
  /** `to` is null when there is no single obvious destination */
  redirects: z.array(z.object({ from: z.string(), to: z.string().nullable(), hits: z.number() })),
  excluded: z.array(pathHitsSchema.extend({ reason: z.enum(EXCLUSION_REASONS) })),
  bots: z.object({
    byCategory: z.array(nameHitsSchema),
    byName: z.array(nameHitsSchema),
    topPaths: z.array(pathHitsSchema),
  }),
})

export type NotFoundReport = z.infer<typeof notFoundReportSchema>
export type PathHits = z.infer<typeof pathHitsSchema>
type SuggestedRedirect = NotFoundReport['redirects'][number]
type ExcludedPath = NotFoundReport['excluded'][number]
type ExclusionReason = ExcludedPath['reason']

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

/** Sums hits for paths that differ only by trailing slashes, a query string or a hash. */
export function mergePathHits(rows: PathHits[]): PathHits[] {
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

  for (const { path: from, hits } of mergePathHits(rows)) {
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

// Only the NAC center metadata fields the zone routes need, so unrelated schema drift can't fail
// the report
export const nacCenterZonesSchema = z.object({
  zones: z.array(z.object({ status: z.string(), url: z.string().optional() })),
})

/** The forecast routes for a center's active zones, slugged like getActiveForecastZones. */
export function forecastZonePaths({ zones }: z.infer<typeof nacCenterZonesSchema>): string[] {
  const zonePaths = zones.flatMap(({ status, url }) => {
    const slug = status === 'active' ? url?.split('/').filter(Boolean).pop() : undefined
    return slug ? [`/forecasts/avalanche/${slug}`] : []
  })
  return ['/forecasts/avalanche', ...zonePaths]
}

const WAYBACK_LOOKBACK_MS = 30 * 24 * 60 * 60 * 1000

/**
 * A Wayback Machine link to the old page. It asks for a capture from a month before the report
 * window, so the nearest capture is the center's previous site rather than today's 404.
 */
export function waybackUrl(report: Pick<NotFoundReport, 'domain' | 'range'>, path: string) {
  const before = new Date(Date.parse(report.range.start) - WAYBACK_LOOKBACK_MS)
  // YYYYMMDD, the Wayback timestamp format
  const timestamp = before.toISOString().slice(0, 10).replace(/-/g, '')
  return `https://web.archive.org/web/${timestamp}/https://${report.domain}${path}`
}
