const mockRevalidateTag = jest.fn()
const mockRevalidatePath = jest.fn()
jest.mock('next/cache', () => ({
  revalidateTag: (tag: string) => mockRevalidateTag(tag),
  revalidatePath: (path: string) => mockRevalidatePath(path),
}))

const mockReportIndeterminate = jest.fn()
jest.mock('../../src/utilities/freshnessTelemetry', () => ({
  reportIndeterminate: (...args: unknown[]) => mockReportIndeterminate(...args),
}))

const mockGetCenterWarnings = jest.fn()
const mockGetCenterWarningsFresh = jest.fn()
// The real fingerprint is used — only the two fetches are stubbed, so the route's staleness
// comparison is exercised for real.
jest.mock('../../src/services/nac/centerWarnings', () => {
  const actual = jest.requireActual('../../src/services/nac/centerWarnings')
  return {
    centerWarningsFingerprint: actual.centerWarningsFingerprint,
    getCenterWarnings: (...a: unknown[]) => mockGetCenterWarnings(...a),
    getCenterWarningsFresh: (...a: unknown[]) => mockGetCenterWarningsFresh(...a),
  }
})

// Avoid loading the real nac module (and payload) just for the cache-tag helper.
jest.mock('../../src/services/nac/nac', () => ({
  warningCacheTag: (centerId: string, zoneId: number) =>
    `warning:${centerId === 'dvac' ? 'nwac' : centerId}:${zoneId}`,
}))

// Import the handler after the mocks are registered (jest hoists the mocks above imports).
import { GET } from '@/app/api/[center]/warning-freshness/[fingerprint]/route'
import {
  centerWarningsFingerprint,
  type AlertProductType,
  type CenterWarningGroup,
} from '@/services/nac/centerWarnings'
import { ProductType } from '@/services/nac/model/forecast'
import { warningFixture } from '../fixtures/warningProducts'

function group(
  productType: AlertProductType,
  zoneId: number,
  bottomLine = 'Avoid avalanche terrain.',
): CenterWarningGroup {
  return {
    productType,
    entries: [
      {
        zone: { id: zoneId, name: `Zone ${zoneId}`, slug: `zone-${zoneId}` },
        warning: warningFixture(productType, { id: zoneId * 10, bottom_line: bottomLine }),
      },
    ],
  }
}

const NONE: CenterWarningGroup[] = []
const WARNING_Z1 = [group(ProductType.Warning, 1)]
const WARNING_Z1_UPDATED = [group(ProductType.Warning, 1, 'Conditions have worsened.')]
const WARNING_Z1_Z2 = [group(ProductType.Warning, 1), group(ProductType.Watch, 2)]

const CACHEABLE = 'public, max-age=0, s-maxage=30'

function call(fingerprint: string, center = 'nwac') {
  const url = `http://localhost/api/${center}/warning-freshness/${fingerprint}`
  return GET(new Request(url), { params: Promise.resolve({ center, fingerprint }) })
}

/** Stand up an upstream/cache pair and ask the endpoint on behalf of a viewer holding `rendered`. */
function check(options: {
  fresh: CenterWarningGroup[] | Error
  cached?: CenterWarningGroup[]
  rendered: CenterWarningGroup[]
}) {
  if (options.fresh instanceof Error) {
    mockGetCenterWarningsFresh.mockRejectedValue(options.fresh)
  } else {
    mockGetCenterWarningsFresh.mockResolvedValue(options.fresh)
  }
  if (options.cached) mockGetCenterWarnings.mockResolvedValue(options.cached)

  return call(centerWarningsFingerprint(options.rendered))
}

async function answer(res: Response) {
  return {
    status: res.status,
    cacheControl: res.headers.get('Cache-Control'),
    body: await res.json(),
  }
}

/** Asserts the endpoint changed nothing and told the viewer their render is still current. */
async function expectNoChange(res: Response) {
  const { status, body } = await answer(res)
  expect(status).toBe(200)
  expect(body.changed).toBe(false)
  expect(mockRevalidateTag).not.toHaveBeenCalled()
  expect(mockRevalidatePath).not.toHaveBeenCalled()
}

/**
 * The caller-driven path purge is throttled per center by module-level state, which outlives a
 * test. Every test therefore starts an hour on from the last — comfortably past any plausible
 * cooldown — so only the test that means to observe the throttle does.
 */
let clock = Date.now()

beforeEach(() => {
  jest.useFakeTimers()
  clock += 60 * 60_000
  jest.setSystemTime(clock)

  mockRevalidateTag.mockClear()
  mockRevalidatePath.mockClear()
  mockReportIndeterminate.mockClear()
  mockGetCenterWarnings.mockReset()
  mockGetCenterWarningsFresh.mockReset()
})

afterEach(() => {
  jest.useRealTimers()
})

describe('warning-freshness route', () => {
  it('reports no change, cacheably, when nothing has changed', async () => {
    const res = await answer(
      await check({ fresh: WARNING_Z1, cached: WARNING_Z1, rendered: WARNING_Z1 }),
    )

    expect(res.body).toEqual({ changed: false })
    expect(res.cacheControl).toBe(CACHEABLE)
    expect(mockRevalidateTag).not.toHaveBeenCalled()
    expect(mockRevalidatePath).not.toHaveBeenCalled()
  })

  it('reports no change, cacheably, when no alerts are active and none were rendered', async () => {
    const res = await answer(await check({ fresh: NONE, cached: NONE, rendered: NONE }))

    expect(res.body).toEqual({ changed: false })
    expect(res.cacheControl).toBe(CACHEABLE)
    expect(mockRevalidateTag).not.toHaveBeenCalled()
  })

  it('purges the zone tag and reports a change when a warning is newly issued', async () => {
    const res = await answer(await check({ fresh: WARNING_Z1, cached: NONE, rendered: NONE }))

    expect(res.body).toEqual({ changed: true, etag: centerWarningsFingerprint(WARNING_Z1) })
    expect(res.cacheControl).toBe('no-store')
    expect(mockRevalidateTag).toHaveBeenCalledWith('warning:nwac:1')
  })

  it('purges the tags of every zone on either side of the change', async () => {
    await check({ fresh: WARNING_Z1_Z2, cached: WARNING_Z1, rendered: WARNING_Z1 })

    expect(mockRevalidateTag).toHaveBeenCalledWith('warning:nwac:1')
    expect(mockRevalidateTag).toHaveBeenCalledWith('warning:nwac:2')
  })

  it('purges the home page too, so the viewer’s refresh is not a no-op', async () => {
    await check({ fresh: WARNING_Z1, cached: NONE, rendered: NONE })

    expect(mockRevalidatePath).toHaveBeenCalledWith('/')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/nwac')
  })

  it('tells a viewer holding a stale render to refresh even when the shared cache is current', async () => {
    // The upstream cache has already caught up; only this viewer's rendered page is behind.
    const res = await answer(
      await check({ fresh: WARNING_Z1_UPDATED, cached: WARNING_Z1_UPDATED, rendered: WARNING_Z1 }),
    )

    expect(res.body.changed).toBe(true)
    expect(mockRevalidateTag).not.toHaveBeenCalled()
    expect(mockRevalidatePath).toHaveBeenCalledWith('/')
  })

  it('purges the home page once per window for a stale render only the caller can attest to', async () => {
    // The address is a URL now, so anyone can assert a stale render with a random 40-hex string —
    // an <img src> on someone else's page will do it. One purge already serves every viewer who
    // was behind, so a second inside the window is pure cost.
    const stale = { fresh: WARNING_Z1_UPDATED, cached: WARNING_Z1_UPDATED, rendered: WARNING_Z1 }

    await check(stale)
    expect(mockRevalidatePath).toHaveBeenCalledTimes(2) // '/' and '/nwac'

    for (let i = 0; i < 5; i++) await check(stale)

    expect(mockRevalidatePath).toHaveBeenCalledTimes(2)
  })

  it('still purges inside the window for a change the server can see for itself', async () => {
    // The throttle covers the caller's claim, never the server's own comparison — otherwise an
    // alert issued moments after a spammed request would sit behind a cooldown.
    await check({ fresh: WARNING_Z1_UPDATED, cached: WARNING_Z1_UPDATED, rendered: WARNING_Z1 })
    mockRevalidatePath.mockClear()

    await check({ fresh: WARNING_Z1, cached: NONE, rendered: NONE })

    expect(mockRevalidatePath).toHaveBeenCalledWith('/')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/nwac')
  })

  it('throttles each center separately', async () => {
    const stale = { fresh: WARNING_Z1_UPDATED, cached: WARNING_Z1_UPDATED, rendered: WARNING_Z1 }

    mockGetCenterWarningsFresh.mockResolvedValue(stale.fresh)
    mockGetCenterWarnings.mockResolvedValue(stale.cached)
    await call(centerWarningsFingerprint(stale.rendered), 'nwac')
    await call(centerWarningsFingerprint(stale.rendered), 'sac')

    expect(mockRevalidatePath).toHaveBeenCalledWith('/nwac')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/sac')
  })

  it('does NOT blank a live banner when the fresh set goes empty (upstream blip or all-clear)', async () => {
    const res = await check({ fresh: NONE, cached: WARNING_Z1, rendered: WARNING_Z1 })

    await expectNoChange(res)
  })

  it('never caches the empty-fresh-vs-populated-cache answer, so the next viewer retries', async () => {
    const res = await answer(await check({ fresh: NONE, cached: WARNING_Z1, rendered: WARNING_Z1 }))

    expect(res.body).toEqual({ changed: false, reason: 'indeterminate' })
    expect(res.cacheControl).toBe('no-store')
    // Nothing on screen changes, so without this the blip is invisible.
    expect(mockReportIndeterminate).toHaveBeenCalledWith('warning-vanished', 'nwac')
  })

  it('propagates a genuine all-clear once the shared cache agrees the alerts are gone', async () => {
    const res = await answer(await check({ fresh: NONE, cached: NONE, rendered: WARNING_Z1 }))

    expect(res.body.changed).toBe(true)
    expect(mockRevalidatePath).toHaveBeenCalledWith('/')
  })

  it('reports an uncacheable no-change when upstream is unreachable', async () => {
    const res = await check({
      fresh: new Error('NAC API request failed with status 503'),
      rendered: WARNING_Z1,
    })

    await expectNoChange(res)
  })

  it('never caches the upstream-unreachable answer', async () => {
    const res = await answer(
      await check({ fresh: new Error('NAC API request failed'), rendered: WARNING_Z1 }),
    )

    expect(res.body).toEqual({ changed: false, reason: 'indeterminate' })
    expect(res.cacheControl).toBe('no-store')
    expect(mockReportIndeterminate).toHaveBeenCalledWith('warnings-unreachable', 'nwac')
  })

  it('rejects an unknown center without fanning out upstream', async () => {
    const res = await call(centerWarningsFingerprint(WARNING_Z1), 'not-a-center')

    expect(res.status).toBe(404)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
    expect(mockGetCenterWarningsFresh).not.toHaveBeenCalled()
  })

  it('400s a malformed fingerprint without fanning out upstream', async () => {
    const res = await call('not-a-fingerprint')

    expect(res.status).toBe(400)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
    expect(mockGetCenterWarningsFresh).not.toHaveBeenCalled()
  })
})
