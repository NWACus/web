/**
 * The two archive fetchers differ only in what they do with a failure, and that difference is the
 * whole point of having both: the archive browser renders "unable to load" from a thrown error and
 * "no products found" from an empty list, so a broken archive must never arrive as `[]`.
 */
jest.mock('../../src/payload.config', () => ({}))

jest.mock('payload', () => ({
  getPayload: jest.fn(),
}))

// unstable_cache needs a request-scoped incremental cache that no jest run has. Calling through
// leaves each case fetching for itself, which is what these assertions are about anyway.
jest.mock('next/cache', () => ({
  unstable_cache: <T>(fn: T) => fn,
}))

import { fetchProductArchive, fetchProductArchiveOrThrow } from '@/services/nac/nac'

const PRODUCT = {
  id: 1,
  product_type: 'forecast',
  published_time: '2026-04-05T02:30:00+00:00',
  danger_rating: 2,
  author: 'Forecaster',
  updated_at: '2026-04-05T02:30:00+00:00',
  forecast_zone: [{ id: 1646, name: 'Banner Summit' }],
}

let fetchSpy: jest.SpiedFunction<typeof globalThis.fetch>

function respondWith(body: unknown) {
  fetchSpy.mockImplementation(async () => new Response(JSON.stringify(body)))
}

const WINDOW = { from: '2026-04-01', to: '2026-04-30' }

beforeEach(() => {
  fetchSpy = jest.spyOn(globalThis, 'fetch')
})

afterEach(() => {
  fetchSpy.mockRestore()
})

describe('services: product archive fetchers', () => {
  it('trims a well-formed response to the fields the archive consumes', async () => {
    respondWith([PRODUCT])

    await expect(fetchProductArchiveOrThrow('snfac', WINDOW)).resolves.toEqual([
      {
        id: 1,
        product_type: 'forecast',
        published_time: '2026-04-05T02:30:00+00:00',
        danger_rating: 2,
        author: 'Forecaster',
        updated_at: '2026-04-05T02:30:00+00:00',
        forecast_zone: [{ id: 1646 }],
      },
    ])
  })

  it('defaults the nullable columns rather than dropping the product', async () => {
    const { danger_rating: _d, author: _a, updated_at: _u, ...bare } = PRODUCT
    respondWith([bare])

    const [product] = await fetchProductArchiveOrThrow('snfac', WINDOW)

    expect(product).toMatchObject({ danger_rating: 0, author: null, updated_at: null })
  })

  it('throws when the response does not match the schema', async () => {
    // One required column missing from a zone entry is enough, and is the realistic shape of an
    // upstream change: swallowing it would show the browser's empty state on a broken archive.
    respondWith([{ ...PRODUCT, forecast_zone: [{ id: 1646 }] }])

    await expect(fetchProductArchiveOrThrow('snfac', WINDOW)).rejects.toThrow(
      /Failed to parse product archive response/,
    )
  })

  it('throws when the upstream request fails', async () => {
    fetchSpy.mockImplementation(async () => new Response('nope', { status: 503 }))

    await expect(fetchProductArchiveOrThrow('snfac', WINDOW)).rejects.toThrow()
  })

  it('turns both failures into an empty list for callers where the archive is secondary', async () => {
    respondWith([{ ...PRODUCT, forecast_zone: [{ id: 1646 }] }])
    await expect(fetchProductArchive('snfac', WINDOW)).resolves.toEqual([])

    fetchSpy.mockImplementation(async () => new Response('nope', { status: 503 }))
    await expect(fetchProductArchive('snfac', WINDOW)).resolves.toEqual([])
  })
})
