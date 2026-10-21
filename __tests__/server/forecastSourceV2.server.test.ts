// No Next incremental cache under jest: run the fresh read straight through.
jest.mock('next/cache', () => ({
  unstable_cache: <T>(fn: () => Promise<T>) => fn,
}))

// nac.ts logs through Payload; these cases never reach a real logger.
jest.mock('../../src/payload.config', () => ({}))
jest.mock('payload', () => ({ getPayload: jest.fn() }))

import { forecastSourceV2 } from '@/services/nac/sources/v2/forecastSourceV2'
import nwacForecastActive from './fixtures/nwac-forecast-active.json'

// v2's answer for a real zone with nothing published (NWAC zone 3025, 2026-10-07).
const NOTHING_PUBLISHED = {
  avalanche_center: null,
  media: null,
  weather_data: null,
  json_data: null,
  published_time: null,
  expires_time: null,
  created_at: null,
  updated_at: null,
  forecast_avalanche_problems: [],
  danger: [],
  forecast_zone: [],
}

// A product that exists in the AFP but was never published to readers.
const STUB = { ...nwacForecastActive, updated_at: null }

let fetchSpy: jest.SpiedFunction<typeof globalThis.fetch>

function respondWith(response: () => Response) {
  fetchSpy.mockImplementation(async () => response())
}

beforeEach(() => {
  fetchSpy = jest.spyOn(globalThis, 'fetch')
})

afterEach(() => {
  fetchSpy.mockRestore()
})

describe('forecastSourceV2.lookupForecast', () => {
  it('finds a published product', async () => {
    respondWith(() => Response.json(nwacForecastActive))

    const lookup = await forecastSourceV2.lookupForecast('nwac', 3020)

    expect(lookup.status).toBe('found')
  })

  // Forecast-176: absence is not an outage.
  it("reads v2's nothing-published placeholder as none", async () => {
    respondWith(() => Response.json(NOTHING_PUBLISHED))

    expect(await forecastSourceV2.lookupForecast('nwac', 3025)).toEqual({ status: 'none' })
  })

  // Forecast-175
  it('reads an unpublished stub as none', async () => {
    respondWith(() => Response.json(STUB))

    expect(await forecastSourceV2.lookupForecast('nwac', 3020)).toEqual({ status: 'none' })
  })

  it('reads an upstream error as failed', async () => {
    respondWith(() => new Response('<html>Slim Application Error</html>', { status: 500 }))

    expect(await forecastSourceV2.lookupForecast('nwac', 3020)).toEqual({ status: 'failed' })
  })

  it('reads a body that is neither a product nor the placeholder as failed', async () => {
    respondWith(() => new Response('<html>Slim Application Error</html>'))

    expect(await forecastSourceV2.lookupForecast('nwac', 3020)).toEqual({ status: 'failed' })
  })
})

describe('forecastSourceV2.getForecast', () => {
  it('returns null for an unpublished stub', async () => {
    respondWith(() => Response.json(STUB))

    expect(await forecastSourceV2.getForecast('nwac', 3020)).toBeNull()
  })
})

describe('forecastSourceV2.getForecastFresh', () => {
  // Forecast-175: the freshness check must not hand an open tab a stub to refresh into.
  it('returns null for an unpublished stub', async () => {
    respondWith(() => Response.json(STUB))

    expect(await forecastSourceV2.getForecastFresh('nwac', 3020)).toBeNull()
  })

  it('returns a published product', async () => {
    respondWith(() => Response.json(nwacForecastActive))

    expect(await forecastSourceV2.getForecastFresh('nwac', 3020)).toMatchObject({
      id: nwacForecastActive.id,
    })
  })
})
