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

/**
 * Runs one HogQL statement and returns rows keyed by column name, validated against `rowSchema`.
 */
export async function queryHogQL<T>(
  config: PostHogQueryConfig,
  query: string,
  rowSchema: z.ZodType<T>,
): Promise<T[]> {
  const response = await fetch(`${config.host}/api/projects/${config.projectId}/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: { kind: 'HogQLQuery', query } }),
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
