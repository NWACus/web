import { z } from 'zod'

// The query API lives on the app host, not the ingest host used by the browser SDK.
export const DEFAULT_POSTHOG_QUERY_HOST = 'https://us.posthog.com'

export type PostHogQueryConfig = {
  apiKey: string
  projectId: string
  host: string
}

/**
 * Server-side credentials for PostHog's query API. HogQL needs a personal API key with
 * `query:read`; the project key the browser uses can only write events.
 */
export function getPostHogQueryConfig(
  env: Record<string, string | undefined> = process.env,
): PostHogQueryConfig | null {
  const apiKey = env.POSTHOG_PERSONAL_API_KEY
  const projectId = env.POSTHOG_PROJECT_ID
  if (!apiKey || !projectId) return null
  return { apiKey, projectId, host: env.POSTHOG_QUERY_HOST || DEFAULT_POSTHOG_QUERY_HOST }
}

/**
 * A HogQL query and the values its `{name}` placeholders stand for. PostHog substitutes and escapes
 * them, so values never need quoting by hand.
 */
export type HogQLStatement = {
  query: string
  values?: Record<string, string | string[]>
}

const hogqlQuery = ({ query, values }: HogQLStatement) => ({ kind: 'HogQLQuery', query, values })

export class PostHogQueryError extends Error {
  constructor(
    message: string,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'PostHogQueryError'
  }
}

const hogqlResultSchema = z.object({
  columns: z.array(z.string()),
  results: z.array(z.array(z.unknown())),
})

// Shape of an async submission or a poll: results appear on the status once complete
const queryStatusSchema = z.object({
  query_status: z.object({
    id: z.string(),
    complete: z.boolean(),
    error: z.boolean().nullable().optional(),
    error_message: z.string().nullable().optional(),
    results: z.unknown().optional(),
  }),
})

const REQUEST_TIMEOUT_MS = 25_000
// One budget for a whole query, retries included, well inside the 300 s function limit
const QUERY_DEADLINE_MS = 120_000
// Polls count toward PostHog's 240 requests a minute, so long queries are polled less often
const POLL_FIRST_MS = 500
const POLL_MAX_MS = 4_000
const RETRY_FIRST_MS = 1_000
const RETRY_MAX_MS = 16_000

/**
 * `blocking` serves PostHog's own cache when fresh; `force_blocking` always recalculates. Both are
 * submitted asynchronously and polled: the synchronous API stops a query after 10 seconds of
 * execution, the async path does not.
 */
export type QueryRefresh = 'blocking' | 'force_blocking'

/**
 * Runs one HogQL statement and returns rows keyed by column name, validated against `rowSchema`.
 */
export async function queryHogQL<T>(
  config: PostHogQueryConfig,
  statement: HogQLStatement,
  rowSchema: z.ZodType<T>,
  refresh: QueryRefresh = 'blocking',
): Promise<T[]> {
  const result = await runQuery(config, statement, refresh, Date.now() + QUERY_DEADLINE_MS)
  return parseRows(result, rowSchema)
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** `Retry-After` is either delay seconds or an HTTP date; null when absent or unreadable. */
export function parseRetryAfter(header: string | null, now = Date.now()): number | null {
  if (!header) return null
  // Whole seconds, e.g. "30"
  if (/^\d+$/.test(header.trim())) return Number(header.trim()) * 1000
  const date = Date.parse(header)
  return Number.isNaN(date) ? null : Math.max(0, date - now)
}

/** Exponential backoff with jitter: half the step is fixed, the other half random. */
const backoff = (attempt: number) => {
  const step = Math.min(RETRY_FIRST_MS * 2 ** attempt, RETRY_MAX_MS)
  return step / 2 + (Math.random() * step) / 2
}

/** Requests one PostHog query path, waiting out 429s until `deadline` (epoch ms). */
async function requestJson(
  config: PostHogQueryConfig,
  path: string,
  deadline: number,
  init: RequestInit = {},
): Promise<unknown> {
  for (let attempt = 0; ; attempt += 1) {
    const response = await fetch(`${config.host}/api/projects/${config.projectId}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        ...init.headers,
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
    if (response.status === 429) {
      await response.arrayBuffer()
      // Retry-After is a floor; backoff still applies when it is missing or already past
      const wait = Math.max(
        parseRetryAfter(response.headers.get('Retry-After')) ?? 0,
        backoff(attempt),
      )
      if (Date.now() + wait > deadline) {
        throw new PostHogQueryError('PostHog rate limited the query past its deadline', {
          status: 429,
          path,
          attempts: attempt + 1,
        })
      }
      await sleep(wait)
      continue
    }
    if (!response.ok) {
      throw new PostHogQueryError(`PostHog query failed with HTTP ${response.status}`, {
        status: response.status,
        body: (await response.text()).slice(0, 500),
      })
    }
    const body: unknown = await response.json()
    return body
  }
}

async function pollQuery(config: PostHogQueryConfig, id: string, deadline: number) {
  for (let interval = POLL_FIRST_MS; Date.now() + interval < deadline; ) {
    await sleep(interval)
    interval = Math.min(interval * 2, POLL_MAX_MS)
    const status = queryStatusSchema.safeParse(await requestJson(config, `/query/${id}/`, deadline))
    if (!status.success) {
      throw new PostHogQueryError('PostHog query status had an unexpected shape', {
        issues: status.error.issues,
      })
    }
    const { complete, error, error_message, results } = status.data.query_status
    if (error) throw new PostHogQueryError(error_message || 'PostHog query failed', { id })
    if (complete) return results
  }
  throw new PostHogQueryError('PostHog query did not finish in time', { id })
}

async function runQuery(
  config: PostHogQueryConfig,
  statement: HogQLStatement,
  refresh: QueryRefresh,
  deadline: number,
): Promise<unknown> {
  const body = await requestJson(config, '/query', deadline, {
    method: 'POST',
    body: JSON.stringify({
      query: hogqlQuery(statement),
      refresh: refresh === 'force_blocking' ? 'force_async' : 'async',
      name: 'avyweb-admin',
    }),
  })
  // A fresh cache hit comes back as the result itself; otherwise it is a status to poll
  const status = queryStatusSchema.safeParse(body)
  if (!status.success) return body
  const { complete, error, error_message, results, id } = status.data.query_status
  if (error) throw new PostHogQueryError(error_message || 'PostHog query failed', { id })
  return complete ? results : pollQuery(config, id, deadline)
}

/**
 * Whether PostHog already holds a fresh result for `statement`. An async submission answers at once
 * from cache, or starts calculating; a calculation nobody asked for is cancelled again.
 */
export async function probeQueryCache(
  config: PostHogQueryConfig,
  statement: HogQLStatement,
): Promise<boolean> {
  // No retries: a rate-limited probe throws, and the caller treats unknown as cold
  const body = await requestJson(config, '/query', Date.now(), {
    method: 'POST',
    body: JSON.stringify({
      query: hogqlQuery(statement),
      refresh: 'async',
      name: 'avyweb-admin-probe',
    }),
  })
  const status = queryStatusSchema.safeParse(body)
  if (!status.success || status.data.query_status.complete) return true
  await requestJson(config, `/query/${status.data.query_status.id}/`, Date.now(), {
    method: 'DELETE',
  }).catch(() => undefined)
  return false
}

function parseRows<T>(result: unknown, rowSchema: z.ZodType<T>): T[] {
  const parsed = hogqlResultSchema.safeParse(result)
  if (!parsed.success) {
    throw new PostHogQueryError('PostHog query returned an unexpected shape', {
      issues: parsed.error.issues,
    })
  }
  const { columns, results } = parsed.data
  return results.map((row, index) => {
    const record = Object.fromEntries(columns.map((column, i) => [column, row[i]]))
    const parsedRow = rowSchema.safeParse(record)
    if (!parsedRow.success) {
      throw new PostHogQueryError('PostHog query returned an unexpected row', {
        index,
        issues: parsedRow.error.issues,
      })
    }
    return parsedRow.data
  })
}
