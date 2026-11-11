const getCachedReport = jest.fn()
jest.mock('../../src/services/posthog/getCachedReport', () => ({
  getCachedReport: (...args: unknown[]) => getCachedReport(...args),
}))
const probeQueryCache = jest.fn()
jest.mock('../../src/services/posthog/hogql', () => ({
  ...jest.requireActual('../../src/services/posthog/hogql'),
  probeQueryCache: (...args: unknown[]) => probeQueryCache(...args),
}))

import { analyticsEstimateHandler, analyticsHandler } from '@/services/posthog/analyticsEndpoint'
import { PostHogQueryError } from '@/services/posthog/hogql'
import { estimateColdSeconds } from '@/services/posthog/reportTypes'

const user = { id: 1, collection: 'users', email: 'staff@example.org' }

function requestFor(query: string, options: { user?: unknown; tenantVisible?: boolean } = {}) {
  const find = jest.fn().mockResolvedValue({ totalDocs: options.tenantVisible === false ? 0 : 1 })
  const warn = jest.fn()
  const req = {
    user: 'user' in options ? options.user : user,
    payload: { find, logger: { warn } },
    searchParams: new URL(`http://localhost/api/analytics?${query}`).searchParams,
  }
  return { req, find, warn }
}

function call(req: ReturnType<typeof requestFor>['req']) {
  // @ts-expect-error the handler only reads user, payload.find, payload.logger and searchParams
  return analyticsHandler(req)
}

function estimate(req: ReturnType<typeof requestFor>['req']) {
  // @ts-expect-error the handler only reads user, payload.find, payload.logger and searchParams
  return analyticsEstimateHandler(req)
}

describe('analyticsHandler', () => {
  const env = process.env
  beforeEach(() => {
    process.env = { ...env, POSTHOG_PERSONAL_API_KEY: 'phx', POSTHOG_PROJECT_ID: '1' }
  })
  afterEach(() => {
    process.env = env
  })

  it('rejects unknown centers and reports', async () => {
    const { req } = requestFor('center=nope&report=overview&from=2026-11-01&to=2026-11-09')
    expect((await call(req)).status).toBe(400)
    const bad = requestFor('center=nwac&report=everything&from=2026-11-01&to=2026-11-09')
    expect((await call(bad.req)).status).toBe(400)
  })

  it('hides centers the user cannot read, and everything from anonymous callers', async () => {
    const hidden = requestFor('center=nwac&report=overview&from=2026-11-01&to=2026-11-09', {
      tenantVisible: false,
    })
    expect((await call(hidden.req)).status).toBe(404)
    expect(hidden.find).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'tenants', overrideAccess: false, user }),
    )

    const anonymous = requestFor('center=nwac&report=overview&from=2026-11-01&to=2026-11-09', {
      user: null,
    })
    expect((await call(anonymous.req)).status).toBe(404)
  })

  it('reports a missing key as not connected', async () => {
    delete process.env.POSTHOG_PERSONAL_API_KEY
    const { req } = requestFor('center=nwac&report=overview&from=2026-11-01&to=2026-11-09')
    expect((await call(req)).status).toBe(503)
  })

  it('validates the range', async () => {
    const { req } = requestFor('center=nwac&report=overview&from=2026-11-09&to=2026-11-01')
    const response = await call(req)
    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'The start date must not be after the end date',
    })
  })

  it('passes a grouping through and refuses unknown or too-fine ones', async () => {
    getCachedReport.mockResolvedValue({ bucket: 'week', points: [] })
    const range = 'center=nwac&report=timeseries&from=2026-10-01&to=2026-11-09'
    expect((await call(requestFor(`${range}&interval=week`).req)).status).toBe(200)
    expect(getCachedReport).toHaveBeenLastCalledWith(
      'nwac',
      expect.objectContaining({ bucket: 'week' }),
      'timeseries',
      false,
    )
    expect((await call(requestFor(`${range}&interval=hour`).req)).status).toBe(400)
    expect((await call(requestFor(`${range}&interval=month`).req)).status).toBe(400)
  })

  it('returns the report with its resolved range and passes the refresh flag through', async () => {
    getCachedReport.mockResolvedValue({ kind: 'breakdown', rows: [] })
    const { req } = requestFor('center=nwac&report=pages&from=2026-11-01&to=2026-11-09&refresh=1')
    const response = await call(req)

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      report: 'pages',
      range: { from: '2026-11-01', to: '2026-11-09', timezone: 'America/Los_Angeles' },
      data: { kind: 'breakdown', rows: [] },
    })
    expect(getCachedReport).toHaveBeenCalledWith('nwac', expect.anything(), 'pages', true)
  })

  it('turns a failed query into a 502 with a warning', async () => {
    getCachedReport.mockRejectedValue(new Error('boom'))
    const { req, warn } = requestFor('center=nwac&report=pages&from=2026-11-01&to=2026-11-09')
    expect((await call(req)).status).toBe(502)
    expect(warn).toHaveBeenCalled()
  })

  it('says PostHog is busy when its rate limit outlasts the query', async () => {
    getCachedReport.mockRejectedValue(new PostHogQueryError('rate limited', { status: 429 }))
    const { req } = requestFor('center=nwac&report=pages&from=2026-11-01&to=2026-11-09')
    const response = await call(req)
    expect(response.status).toBe(502)
    expect(await response.json()).toEqual({
      error: 'PostHog is busy right now. Try again in a minute.',
    })
  })

  it('calls short ranges warm without asking PostHog', async () => {
    const { req } = requestFor('center=nwac&from=2026-10-10&to=2026-11-09')
    const response = await estimate(req)
    await expect(response.json()).resolves.toMatchObject({ cached: true })
    expect(probeQueryCache).not.toHaveBeenCalled()
  })

  it('probes PostHog for long ranges and reports the cold estimate', async () => {
    probeQueryCache.mockResolvedValue(false)
    const { req } = requestFor('center=nwac&from=2025-11-09&to=2026-11-09')
    const body = await (await estimate(req)).json()
    expect(body.cached).toBe(false)
    expect(body.seconds).toBe(estimateColdSeconds(366))
    expect(probeQueryCache).toHaveBeenCalledTimes(1)
  })

  it('applies the same access checks to estimates', async () => {
    const { req } = requestFor('center=nwac&from=2025-11-09&to=2026-11-09', {
      tenantVisible: false,
    })
    expect((await estimate(req)).status).toBe(404)
  })
})
