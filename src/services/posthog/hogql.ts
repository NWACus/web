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

const hogqlResponseSchema = z.object({
  columns: z.array(z.string()),
  results: z.array(z.array(z.unknown())),
})

const QUERY_TIMEOUT_MS = 25_000

/** `blocking` serves PostHog's own cache when fresh; `force_blocking` always recalculates. */
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
    return await runQuery(config, query, rowSchema, refresh)
  } finally {
    release()
  }
}

async function runQuery<T>(
  config: PostHogQueryConfig,
  query: string,
  rowSchema: z.ZodType<T>,
  refresh: QueryRefresh,
): Promise<T[]> {
  const response = await fetch(`${config.host}/api/projects/${config.projectId}/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: { kind: 'HogQLQuery', query }, refresh, name: 'avyweb-admin' }),
    cache: 'no-store',
    signal: AbortSignal.timeout(QUERY_TIMEOUT_MS),
  })

  if (!response.ok) {
    throw new PostHogQueryError(`PostHog query failed with HTTP ${response.status}`, {
      status: response.status,
      body: (await response.text()).slice(0, 500),
    })
  }

  const parsed = hogqlResponseSchema.safeParse(await response.json())
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
