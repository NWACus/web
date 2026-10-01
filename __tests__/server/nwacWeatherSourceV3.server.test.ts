import { v3ApiHost } from '@/services/nac/hosts'
import fixture from './fixtures/nwac-weather-forecasts.json'

// Run the cached function straight through: the cache itself is Next's to test.
jest.mock('next/cache', () => ({
  unstable_cache: (fn: () => unknown) => fn,
}))

// Avoid loading the real nac module (and payload) just for the fetch.
const mockNacFetch = jest.fn()
jest.mock('../../src/services/nac/nac', () => ({
  nacFetch: (...a: unknown[]) => mockNacFetch(...a),
  logNacError: jest.fn(),
  NACError: class NACError extends Error {},
  nwacWeatherCacheTag: 'nwac-weather',
}))

import { getNWACWeatherSource } from '@/services/nac/sources'

const source = getNWACWeatherSource()
const NOTHING_PUBLISHED = { available: false, serviceDate: null, forecasts: [] }

beforeEach(() => {
  mockNacFetch.mockReset()
})

describe('NWAC weather v3 source', () => {
  it('reads a day from the v3 host, cached and tagged for the freshness route to purge', async () => {
    mockNacFetch.mockResolvedValue(fixture)

    const day = await source.getDay('2026-09-14')

    expect(mockNacFetch).toHaveBeenCalledWith('/v3/public/nwac-weather/forecasts?date=2026-09-14', {
      cachedTime: 300,
      tags: ['nwac-weather'],
      host: v3ApiHost,
    })
    expect(day?.serviceDate).toBe('2026-09-14')
    expect(day?.issuances.map((i) => i.type)).toEqual(['afternoon', 'morning'])
  })

  it('reads the fresh day past the data cache', async () => {
    mockNacFetch.mockResolvedValue(fixture)

    const day = await source.getDayFresh('2026-09-14')

    expect(mockNacFetch).toHaveBeenCalledWith('/v3/public/nwac-weather/forecasts?date=2026-09-14', {
      noStore: true,
      host: v3ApiHost,
    })
    expect(day?.issuances).toHaveLength(2)
  })

  it('answers null, not an error, when nothing is published for the date', async () => {
    mockNacFetch.mockResolvedValue(NOTHING_PUBLISHED)

    await expect(source.getDay('2026-09-15')).resolves.toBeNull()
    await expect(source.getDayFresh('2026-09-15')).resolves.toBeNull()
  })

  it('throws on an upstream failure rather than answering "nothing published"', async () => {
    mockNacFetch.mockRejectedValue(new Error('upstream down'))

    await expect(source.getDay('2026-09-14')).rejects.toThrow('upstream down')
    await expect(source.getDayFresh('2026-09-14')).rejects.toThrow('upstream down')
    await expect(source.getDates('2025-09-14', '2026-09-14')).rejects.toThrow('upstream down')
  })

  it('throws on a response the schema rejects', async () => {
    mockNacFetch.mockResolvedValue({ available: true })

    await expect(source.getDay('2026-09-14')).rejects.toThrow('schema validation')
  })

  it('lists each published date once, oldest first', async () => {
    mockNacFetch.mockResolvedValue([
      { serviceDate: '2026-09-14' },
      { serviceDate: '2026-09-13' },
      { serviceDate: '2026-09-14' },
    ])

    await expect(source.getDates('2025-09-14', '2026-09-14')).resolves.toEqual([
      '2026-09-13',
      '2026-09-14',
    ])
    expect(mockNacFetch).toHaveBeenCalledWith(
      '/v3/public/nwac-weather/forecast/archive?from=2025-09-14&to=2026-09-14',
      { cachedTime: 300, tags: ['nwac-weather'], host: v3ApiHost },
    )
  })
})
