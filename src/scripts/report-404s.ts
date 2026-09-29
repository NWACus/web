/**
 * Lists a center's production 404s from Vercel Observability as suggested redirects.
 *
 * Usage: pnpm report:404s <tenant> [--days 30] [--limit 200] [--out <file.json>]
 * Needs VERCEL_TOKEN. See docs/not-found-report.md for the runbook and the output format.
 */
import { buildNotFoundReport, extractSitemapLocs, type PathHits } from '@/utilities/notFoundReport'
import {
  AVALANCHE_CENTERS,
  isValidTenantSlug,
  type ValidTenantSlug,
} from '@/utilities/tenancy/avalancheCenters'
import 'dotenv/config'
import { writeFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'
import { z } from 'zod'

const VERCEL_API = 'https://api.vercel.com'
const VERCEL_TEAM_SLUG = 'nwac'
const VERCEL_PROJECT = 'avy'
const DAY_MS = 24 * 60 * 60 * 1000

// Vercel leaves both bot dimensions empty for requests it doesn't classify as bots
const NON_BOT_FILTER = 'botName:"" AND botCategory:""'

const projectSchema = z.object({ id: z.string(), accountId: z.string() })

const metricsResponseSchema = z.object({
  summary: z.array(
    z.object({
      dimensions: z.record(z.string(), z.string()).optional(),
      values: z.record(z.string(), z.number().nullable()),
    }),
  ),
})

type QueryScope = { ownerId: string; projectIds: string[] }
type TimeRange = { start: string; end: string }

function parseCliArgs() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      days: { type: 'string', default: '30' },
      limit: { type: 'string', default: '200' },
      out: { type: 'string' },
    },
  })
  const tenant = positionals[0]
  if (!tenant || !isValidTenantSlug(tenant)) {
    throw new Error('Usage: pnpm report:404s <tenant> [--days 30] [--limit 200] [--out file.json]')
  }
  return { tenant, days: Number(values.days), limit: Number(values.limit), out: values.out }
}

const MAX_ATTEMPTS = 4
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// The metrics API intermittently answers 502 query_failed, most often under concurrent queries
async function fetchWithRetry(url: string, init: RequestInit, attempt = 1): Promise<Response> {
  const res = await fetch(url, init)
  if (res.status < 500 || attempt >= MAX_ATTEMPTS) return res
  await sleep(2000 * attempt)
  return fetchWithRetry(url, init, attempt + 1)
}

async function vercelFetch(path: string, init: RequestInit = {}): Promise<unknown> {
  const token = process.env.VERCEL_TOKEN
  if (!token) throw new Error('VERCEL_TOKEN is not set')
  const res = await fetchWithRetry(`${VERCEL_API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(`${path} responded ${res.status}: ${await res.text()}`)
  return res.json()
}

async function resolveScope(): Promise<QueryScope> {
  const project = projectSchema.parse(
    await vercelFetch(`/v9/projects/${VERCEL_PROJECT}?slug=${VERCEL_TEAM_SLUG}`),
  )
  return { ownerId: project.accountId, projectIds: [project.id] }
}

// Whole days in UTC, the bucket size the query uses
function dayAlignedRange(days: number): TimeRange {
  const end = Math.ceil(Date.now() / DAY_MS) * DAY_MS
  return {
    start: new Date(end - days * DAY_MS).toISOString(),
    end: new Date(end).toISOString(),
  }
}

/** Sums `vercel.request.count` over the range, optionally split into the top `limit` paths. */
async function queryRequestCount(
  scope: QueryScope,
  range: TimeRange,
  filter: string,
  byPath?: { limit: number },
) {
  const body = {
    scope,
    timeRange: range,
    bucketSeconds: 86400,
    filter,
    metrics: { value: { metric: 'vercel.request.count', aggregation: 'count' } },
    outputs: ['value'],
    ...(byPath && {
      groupBy: ['requestPath'],
      seriesSelection: {
        limit: byPath.limit,
        mode: 'exact',
        rankBy: [{ metric: 'value', direction: 'desc' }],
      },
    }),
  }
  const response = await vercelFetch(`/metrics/v1?teamId=${scope.ownerId}`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return metricsResponseSchema.parse(response).summary.map((row) => ({
    path: row.dimensions?.requestPath ?? '',
    hits: row.values.value ?? 0,
  }))
}

// Grouping by requestPath fails with query_failed on windows much longer than a week
const MAX_PATH_WINDOW_DAYS = 7

function splitIntoWindows(range: TimeRange, days: number): TimeRange[] {
  const windows: TimeRange[] = []
  const end = Date.parse(range.end)
  for (let start = Date.parse(range.start); start < end; start += days * DAY_MS) {
    const windowEnd = Math.min(start + days * DAY_MS, end)
    windows.push({ start: new Date(start).toISOString(), end: new Date(windowEnd).toISOString() })
  }
  return windows
}

/**
 * The top `limit` paths in each week of the range. A path that misses the top `limit` in some
 * weeks is undercounted once the weeks are summed.
 */
async function queryTopPaths(scope: QueryScope, range: TimeRange, filter: string, limit: number) {
  const rows: PathHits[] = []
  for (const window of splitIntoWindows(range, MAX_PATH_WINDOW_DAYS)) {
    rows.push(...(await queryRequestCount(scope, window, filter, { limit })))
  }
  return rows
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} responded ${res.status}`)
  return res.text()
}

/** The center's live URL paths, read from its public sitemap index. */
async function fetchLivePaths(domain: string): Promise<string[]> {
  const sitemapUrls = extractSitemapLocs(await fetchText(`https://${domain}/sitemap.xml`))
  const sitemaps = await Promise.all(sitemapUrls.map(fetchText))
  return sitemaps.flatMap(extractSitemapLocs).map((loc) => new URL(loc).pathname)
}

// Both the apex and www hostnames, since a center's domain can serve either
function centerHostnames(tenant: ValidTenantSlug): string[] {
  const apex = AVALANCHE_CENTERS[tenant].customDomain.replace(/^www\./, '')
  return [apex, `www.${apex}`]
}

async function queryTotal(scope: QueryScope, range: TimeRange, filter: string): Promise<number> {
  const [total] = await queryRequestCount(scope, range, filter)
  return total?.hits ?? 0
}

type Report = {
  tenant: ValidTenantSlug
  hostnames: string[]
  range: TimeRange
  totals: { notFound: number; notFoundNonBot: number }
} & ReturnType<typeof buildNotFoundReport>

function printReport({ tenant, hostnames, range, totals, redirects, excluded }: Report) {
  console.log(`${tenant} 404s on ${hostnames.join(', ')}, ${range.start} to ${range.end}`)
  console.log(`  ${totals.notFound} total, ${totals.notFoundNonBot} from non-bot clients`)
  console.log(`\nSet aside: ${excluded.length}`)
  for (const { path, hits, reason } of excluded) {
    console.log(`  ${String(hits).padStart(6)}  ${path}  (${reason})`)
  }
  const withDestination = redirects.filter((redirect) => redirect.to).length
  console.log(`\nSuggested redirects: ${redirects.length} (${withDestination} with a destination)`)
  for (const { from, to, hits } of redirects) {
    console.log(`  ${String(hits).padStart(6)}  ${from}  →  ${to ?? '?'}`)
  }
}

async function main() {
  const { tenant, days, limit, out } = parseCliArgs()
  const hostnames = centerHostnames(tenant)
  const hostFilter = hostnames.map((host) => `requestHostname:"${host}"`).join(' OR ')
  const notFound = `httpStatus:"404" AND (${hostFilter})`
  const notFoundNonBot = `${notFound} AND ${NON_BOT_FILTER}`

  const scope = await resolveScope()
  const range = dayAlignedRange(days)
  // Queries run one at a time; see vercelFetch
  const allTotal = await queryTotal(scope, range, notFound)
  const nonBotTotal = await queryTotal(scope, range, notFoundNonBot)
  const rows = await queryTopPaths(scope, range, notFoundNonBot, limit)
  const livePaths = await fetchLivePaths(AVALANCHE_CENTERS[tenant].customDomain)
  const report: Report = {
    tenant,
    hostnames,
    range,
    totals: { notFound: allTotal, notFoundNonBot: nonBotTotal },
    ...buildNotFoundReport(rows, livePaths),
  }

  printReport(report)
  if (out) {
    await writeFile(out, `${JSON.stringify(report, null, 2)}\n`)
    console.log(`\nWrote ${out}`)
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
