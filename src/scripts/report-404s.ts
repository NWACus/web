/**
 * Reports a center's production 404s from Vercel Observability: suggested redirects for the
 * center's staff to fill in, plus a breakdown of bot traffic.
 *
 * Usage: pnpm report:404s <tenant> [--days 30] [--limit 200] [--out <dir>]
 *        pnpm report:404s --from <report.json> [--out <dir>]
 * Needs VERCEL_TOKEN. See docs/not-found-report.md for the runbook and the output files.
 */
// First, so .env is loaded before hosts.ts reads NAC_HOST and AFP_HOST at module load
import 'dotenv/config'

import { nacCenterId } from '@/services/nac/centerSlug'
import { afpApiHost, nacApiHost } from '@/services/nac/hosts'
import { allAvalancheCenterCapabilitiesSchema } from '@/services/nac/types/schemas'
import {
  buildNotFoundReport,
  extractSitemapLocs,
  forecastZonePaths,
  mergePathHits,
  nacCenterZonesSchema,
  notFoundReportSchema,
  type NotFoundReport,
  type PathHits,
} from '@/utilities/notFoundReport'
import { toRedirectsCsv } from '@/utilities/notFoundReportCsv'
import { toReportHtml } from '@/utilities/notFoundReportHtml'
import {
  AVALANCHE_CENTERS,
  isValidTenantSlug,
  type ValidTenantSlug,
} from '@/utilities/tenancy/avalancheCenters'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { parseArgs } from 'node:util'
import { z } from 'zod'

const USAGE = `Usage: pnpm report:404s <tenant> [--days 30] [--limit 200] [--out <dir>]
       pnpm report:404s --from <report.json> [--out <dir>]`

const VERCEL_API = 'https://api.vercel.com'
const VERCEL_TEAM_SLUG = 'nwac'
const VERCEL_PROJECT = 'avy'
const DAY_MS = 24 * 60 * 60 * 1000

// Vercel leaves both bot dimensions empty for requests it doesn't classify as bots
const NON_BOT_FILTER = 'botName:"" AND botCategory:""'
const BOT_FILTER = '(botName!="" OR botCategory!="")'

const projectSchema = z.object({ id: z.string(), accountId: z.string() })

const metricsResponseSchema = z.object({
  summary: z.array(
    z.object({
      dimensions: z.record(z.string(), z.string()).default({}),
      values: z.record(z.string(), z.number().nullable()),
    }),
  ),
})

type QueryScope = { ownerId: string; projectIds: string[] }
type TimeRange = { start: string; end: string }
type GroupBy = { dimension: string; limit: number }
type Source = { from: string } | { tenant: ValidTenantSlug }

function parseSource(tenant: string | undefined, from: string | undefined): Source {
  if (from) return { from }
  if (tenant && isValidTenantSlug(tenant)) return { tenant }
  throw new Error(USAGE)
}

// Observability Plus keeps 30 days of request data
const RETENTION_DAYS = 30

function parseCount(option: string, value: string): number {
  const count = Number(value)
  if (!Number.isInteger(count) || count < 1) {
    throw new Error(`--${option} must be a positive whole number, got "${value}"`)
  }
  return count
}

// Capped so the report's date range doesn't claim days Vercel no longer has
function parseDays(value: string): number {
  const days = parseCount('days', value)
  if (days <= RETENTION_DAYS) return days
  console.warn(
    `Warning: Vercel keeps ${RETENTION_DAYS} days of data, so the report covers the last ${RETENTION_DAYS} days, not ${days}.`,
  )
  return RETENTION_DAYS
}

function parseCliArgs() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      days: { type: 'string', default: String(RETENTION_DAYS) },
      limit: { type: 'string', default: '200' },
      out: { type: 'string' },
      from: { type: 'string' },
    },
  })
  return {
    source: parseSource(positionals[0], values.from),
    days: parseDays(values.days),
    limit: parseCount('limit', values.limit),
    out: values.out,
  }
}

// Braille dots, redrawn in place on stderr while the queries run
const SPINNER_FRAMES = '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
// Carriage return plus "erase line", so each frame overwrites the last
const CLEAR_LINE = '\r\x1b[2K'

function startSpinner() {
  const startedAt = Date.now()
  let label = 'Starting'
  let frame = 0
  const render = () => {
    const seconds = Math.round((Date.now() - startedAt) / 1000)
    process.stderr.write(
      `${CLEAR_LINE}${SPINNER_FRAMES[frame++ % SPINNER_FRAMES.length]} ${label} (${seconds}s)`,
    )
  }
  const timer = process.stderr.isTTY ? setInterval(render, 100) : undefined
  return {
    update(next: string) {
      label = next
      if (!timer) console.error(next)
    },
    stop() {
      clearInterval(timer)
      if (timer) process.stderr.write(CLEAR_LINE)
    },
  }
}

type Spinner = ReturnType<typeof startSpinner>

const MAX_ATTEMPTS = 4
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const isRetryableStatus = (status: number) => status === 429 || status >= 500

// The metrics API intermittently answers 502 query_failed, most often under concurrent queries. A
// run takes minutes, so a rate limit or dropped connection shouldn't throw away the queries so far.
async function fetchWithRetry(url: string, init: RequestInit = {}, attempt = 1): Promise<Response> {
  if (attempt >= MAX_ATTEMPTS) return fetch(url, init)
  // fetch throws on a network failure, such as a reset connection
  const res = await fetch(url, init).catch(() => null)
  if (res && !isRetryableStatus(res.status)) return res
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

function groupBySelection(groupBy?: GroupBy) {
  if (!groupBy) return {}
  return {
    groupBy: [groupBy.dimension],
    seriesSelection: {
      limit: groupBy.limit,
      mode: 'exact',
      rankBy: [{ metric: 'value', direction: 'desc' }],
    },
  }
}

/** Counts requests over the range, optionally split into the top `limit` values of a dimension. */
async function queryRequestCount(
  scope: QueryScope,
  range: TimeRange,
  filter: string,
  groupBy?: GroupBy,
) {
  const body = {
    scope,
    timeRange: range,
    bucketSeconds: 86400,
    filter,
    metrics: { value: { metric: 'vercel.request.count', aggregation: 'count' } },
    outputs: ['value'],
    ...groupBySelection(groupBy),
  }
  const response = await vercelFetch(`/metrics/v1?teamId=${scope.ownerId}`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  const dimension = groupBy?.dimension ?? ''
  return metricsResponseSchema.parse(response).summary.map(({ dimensions, values }) => ({
    name: dimensions[dimension] ?? '',
    hits: values.value ?? 0,
  }))
}

async function queryTotal(scope: QueryScope, range: TimeRange, filter: string): Promise<number> {
  const [total] = await queryRequestCount(scope, range, filter)
  return total?.hits ?? 0
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
 * The top `limit` paths in each week of the range, summed. A path that misses the top `limit` in
 * some weeks is undercounted.
 */
async function queryTopPaths(
  scope: QueryScope,
  range: TimeRange,
  filter: string,
  limit: number,
  onWeek: (week: number, weeks: number) => void,
): Promise<PathHits[]> {
  const windows = splitIntoWindows(range, MAX_PATH_WINDOW_DAYS)
  const rows: PathHits[] = []
  for (const [index, window] of windows.entries()) {
    onWeek(index + 1, windows.length)
    const weekRows = await queryRequestCount(scope, window, filter, {
      dimension: 'requestPath',
      limit,
    })
    rows.push(...weekRows.map(({ name, hits }) => ({ path: name, hits })))
  }
  return mergePathHits(rows)
}

async function fetchText(url: string): Promise<string> {
  const res = await fetchWithRetry(url)
  if (!res.ok) throw new Error(`${url} responded ${res.status}`)
  return res.text()
}

/** The paths in the center's public sitemap index: the home page, Pages and Posts. */
async function fetchSitemapPaths(domain: string): Promise<string[]> {
  const sitemapUrls = extractSitemapLocs(await fetchText(`https://${domain}/sitemap.xml`))
  const sitemaps = await Promise.all(sitemapUrls.map(fetchText))
  return sitemaps.flatMap(extractSitemapLocs).map((loc) => new URL(loc).pathname)
}

const fetchJson = async (url: string): Promise<unknown> => JSON.parse(await fetchText(url))

// Zone routes 404 unless the center publishes forecasts on the AFP, as getActiveForecastZones checks
async function fetchForecastZonePaths(tenant: ValidTenantSlug): Promise<string[]> {
  const centerId = nacCenterId(tenant)
  const [capabilities, metadata] = await Promise.all([
    fetchJson(`${afpApiHost}?rest_route=/v1/public/avalanche-centers`),
    fetchJson(`${nacApiHost}/v2/public/avalanche-center/${centerId}`),
  ])
  const { centers } = allAvalancheCenterCapabilitiesSchema.parse(capabilities)
  const publishesForecasts = centers.some(
    ({ id, platforms }) => id === centerId && platforms.forecasts,
  )
  return publishesForecasts ? forecastZonePaths(nacCenterZonesSchema.parse(metadata)) : []
}

/** The center's live URL paths: its sitemap, plus the forecast zone routes the sitemap omits. */
async function fetchLivePaths(tenant: ValidTenantSlug, domain: string): Promise<string[]> {
  const [sitemapPaths, zonePaths] = await Promise.all([
    fetchSitemapPaths(domain),
    fetchForecastZonePaths(tenant),
  ])
  return [...sitemapPaths, ...zonePaths]
}

// Both the apex and www hostnames, since a center's domain can serve either
function centerHostnames(domain: string): string[] {
  const apex = domain.replace(/^www\./, '')
  return [apex, `www.${apex}`]
}

const BOT_PATH_LIMIT = 50
const BOT_NAME_LIMIT = 25

async function queryBotTraffic(
  scope: QueryScope,
  range: TimeRange,
  notFound: string,
  spinner: Spinner,
): Promise<NotFoundReport['bots']> {
  const bots = `${notFound} AND ${BOT_FILTER}`
  spinner.update('Breaking down bot traffic by category')
  const byCategory = await queryRequestCount(scope, range, `${notFound} AND botCategory!=""`, {
    dimension: 'botCategory',
    limit: BOT_NAME_LIMIT,
  })
  spinner.update('Breaking down bot traffic by bot')
  const byName = await queryRequestCount(scope, range, `${notFound} AND botName!=""`, {
    dimension: 'botName',
    limit: BOT_NAME_LIMIT,
  })
  // One week only: paths across all bot traffic is millions of rows, too slow to page by week
  spinner.update('Fetching the paths bots requested most in the last 7 days')
  const lastWeek = {
    start: new Date(Date.parse(range.end) - 7 * DAY_MS).toISOString(),
    end: range.end,
  }
  const topPaths = await queryRequestCount(scope, lastWeek, bots, {
    dimension: 'requestPath',
    limit: BOT_PATH_LIMIT,
  })
  return {
    byCategory,
    byName,
    topPaths: mergePathHits(topPaths.map(({ name, hits }) => ({ path: name, hits }))),
  }
}

/** Queries run one at a time; see fetchWithRetry. */
async function collectReport(
  tenant: ValidTenantSlug,
  days: number,
  limit: number,
  spinner: Spinner,
): Promise<NotFoundReport> {
  const { name: centerName, customDomain: domain } = AVALANCHE_CENTERS[tenant]
  const hostnames = centerHostnames(domain)
  const hostFilter = hostnames.map((host) => `requestHostname:"${host}"`).join(' OR ')
  const notFound = `httpStatus:"404" AND (${hostFilter})`
  const notFoundNonBot = `${notFound} AND ${NON_BOT_FILTER}`
  const range = dayAlignedRange(days)

  // First, so an unreachable sitemap fails the run before minutes of metrics queries
  spinner.update(`Reading ${domain}/sitemap.xml and the center's forecast zones`)
  const livePaths = await fetchLivePaths(tenant, domain)
  spinner.update('Resolving the Vercel project')
  const scope = await resolveScope()
  spinner.update('Counting 404s')
  const notFoundTotal = await queryTotal(scope, range, notFound)
  const nonBotTotal = await queryTotal(scope, range, notFoundNonBot)
  const rows = await queryTopPaths(scope, range, notFoundNonBot, limit, (week, weeks) =>
    spinner.update(`Fetching the paths people request most, week ${week} of ${weeks}`),
  )
  const bots = await queryBotTraffic(scope, range, notFound, spinner)

  return {
    tenant,
    centerName,
    domain: hostnames[0],
    hostnames,
    range,
    totals: { notFound: notFoundTotal, notFoundNonBot: nonBotTotal },
    ...buildNotFoundReport(rows, livePaths),
    bots,
  }
}

async function readReport(path: string): Promise<NotFoundReport> {
  return notFoundReportSchema.parse(JSON.parse(await readFile(path, 'utf8')))
}

async function queryReport(tenant: ValidTenantSlug, days: number, limit: number) {
  const spinner = startSpinner()
  try {
    return await collectReport(tenant, days, limit, spinner)
  } finally {
    spinner.stop()
  }
}

const formatNumber = (value: number) => value.toLocaleString('en-US')

function printSummary({ centerName, domain, totals, redirects, excluded, bots }: NotFoundReport) {
  const withDestination = redirects.filter(({ to }) => to).length
  const topCategories = bots.byCategory
    .slice(0, 3)
    .map(({ name, hits }) => `${name} ${formatNumber(hits)}`)
  console.log(`${centerName} (${domain})`)
  console.log(
    `  ${formatNumber(totals.notFound)} 404s, ${formatNumber(totals.notFoundNonBot)} from people`,
  )
  console.log(
    `  ${redirects.length} old URLs to review (${withDestination} with a suggestion), ${excluded.length} set aside`,
  )
  console.log(`  Top bot categories: ${topCategories.join(', ')}`)
}

function defaultOutDir(source: Source, report: NotFoundReport): string {
  if ('from' in source) return dirname(source.from)
  return join('404-reports', `${report.tenant}-${new Date().toISOString().slice(0, 10)}`)
}

async function writeReportFiles(dir: string, report: NotFoundReport) {
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`)
  await writeFile(join(dir, 'redirects.csv'), toRedirectsCsv(report))
  await writeFile(join(dir, 'report.html'), toReportHtml(report))
  console.log(`\nWrote ${join(dir, 'report.html')}, redirects.csv and report.json`)
}

async function main() {
  const { source, days, limit, out } = parseCliArgs()
  const report =
    'from' in source ? await readReport(source.from) : await queryReport(source.tenant, days, limit)
  printSummary(report)
  await writeReportFiles(out ?? defaultOutDir(source, report), report)
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
