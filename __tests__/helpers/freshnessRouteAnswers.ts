/**
 * Shared scaffolding for the freshness route tests. The three routes (forecast, warning, weather)
 * share one answer vocabulary — see `src/utilities/freshnessResponses.ts` — so the tests read an
 * answer, and assert the indeterminate one, the same way.
 */

/** The only cacheable answer's Cache-Control, as the edge sees it. */
export const CACHEABLE = 'public, max-age=0, s-maxage=30'

/** A well-formed fingerprint that no product will ever hash to. */
export const STALE_ETAG = 'f'.repeat(40)

export async function answer(res: Response) {
  return {
    status: res.status,
    cacheControl: res.headers.get('Cache-Control'),
    body: await res.json(),
  }
}

export type FreshnessAnswer = Awaited<ReturnType<typeof answer>>

/**
 * The uncacheable "we could not establish the current product" answer, having changed nothing.
 * Every branch that reaches it is a different failure; what they must share is this reply.
 */
export function expectIndeterminate(res: FreshnessAnswer, revalidateTag: jest.Mock) {
  expect(res.status).toBe(200)
  expect(res.body).toEqual({ changed: false, reason: 'indeterminate' })
  expect(res.cacheControl).toBe('no-store')
  expect(revalidateTag).not.toHaveBeenCalled()
}
