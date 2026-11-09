import { z } from 'zod'

// The query API lives on the app host, not the ingest host used by the browser SDK.
export const DEFAULT_POSTHOG_QUERY_HOST = 'https://us.posthog.com'

// PostHog allows three queries running at once per project.
export const POSTHOG_MAX_CONCURRENT_QUERIES = 3

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
const POLL_INTERVAL_MS = 1_500
const POLL_DEADLINE_MS = 120_000

/**
 * `blocking` serves PostHog's own cache when fresh; `force_blocking` always recalculates. Both are
 * submitted asynchronously and polled: the synchronous API stops a query after 10 seconds of
 * execution, the async path does not.
 */
export type QueryRefresh = 'blocking' | 'force_blocking'

/** Serialises calls to PostHog's concurrency limit; excess callers wait their turn. */
function createSemaphore(limit: number) {
  let active = 0
  const waiting: Array<() => void> = []
  const release = () => {
    const next = waiting.shift()
    if (next) next()
    else active -= 1
  }
  const acquire = () =>
    new Promise<() => void>((resolve) => {
      if (active < limit) {
        active += 1
        resolve(release)
      } else {
        waiting.push(() => resolve(release))
      }
    })
  return { acquire }
}

const querySlots = createSemaphore(POSTHOG_MAX_CONCURRENT_QUERIES)

/**
 * Runs one HogQL statement and returns rows keyed by column name, validated against `rowSchema`.
 */
export async function queryHogQL<T>(
  config: PostHogQueryConfig,
  query: string,
  rowSchema: z.ZodType<T>,
  refresh: QueryRefresh = 'blocking',
): Promise<T[]> {
  const release = await querySlots.acquire()
  try {
    const result = await runQuery(config, query, refresh)
    return parseRows(result, rowSchema)
  } finally {
    release()
  }
}

async function requestJson(config: PostHogQueryConfig, path: string, init: RequestInit = {}) {
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
  if (!response.ok) {
    throw new PostHogQueryError(`PostHog query failed with HTTP ${response.status}`, {
      status: response.status,
      body: (await response.text()).slice(0, 500),
    })
  }
  const body: unknown = await response.json()
  return body
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function pollQuery(config: PostHogQueryConfig, id: string): Promise<unknown> {
  const deadline = Date.now() + POLL_DEADLINE_MS
  while (Date.now() < deadline) {
    await sleep(POLL_INTERVAL_MS)
    const status = queryStatusSchema.safeParse(await requestJson(config, `/query/${id}/`))
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
  query: string,
  refresh: QueryRefresh,
): Promise<unknown> {
  const body = await requestJson(config, '/query', {
    method: 'POST',
    body: JSON.stringify({
      query: { kind: 'HogQLQuery', query },
      refresh: refresh === 'force_blocking' ? 'force_async' : 'async',
      name: 'avyweb-admin',
    }),
  })
  // A fresh cache hit comes back as the result itself; otherwise it is a status to poll
  const status = queryStatusSchema.safeParse(body)
  if (!status.success) return body
  const { complete, error, error_message, results, id } = status.data.query_status
  if (error) throw new PostHogQueryError(error_message || 'PostHog query failed', { id })
  return complete ? results : pollQuery(config, id)
}

/**
 * Whether PostHog already holds a fresh result for `query`. An async submission answers at once
 * from cache, or starts calculating; a calculation nobody asked for is cancelled again.
 */
export async function probeQueryCache(config: PostHogQueryConfig, query: string): Promise<boolean> {
  const body = await requestJson(config, '/query', {
    method: 'POST',
    body: JSON.stringify({
      query: { kind: 'HogQLQuery', query },
      refresh: 'async',
      name: 'avyweb-admin-probe',
    }),
  })
  const status = queryStatusSchema.safeParse(body)
  if (!status.success || status.data.query_status.complete) return true
  await requestJson(config, `/query/${status.data.query_status.id}/`, { method: 'DELETE' }).catch(
    () => undefined,
  )
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
