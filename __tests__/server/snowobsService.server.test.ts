import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

jest.mock('../../src/payload.config', () => ({}))

jest.mock('payload', () => ({
  getPayload: jest.fn(),
}))

import { fetchStationTimeseries, SnowObsError } from '@/services/snowobs/snowobs'
import type { SnowObsTimeseriesResponse } from '@/services/snowobs/types/schemas'
import type { Payload } from 'payload'
import { getPayload } from 'payload'

const TIMESERIES_URL = 'https://api.snowobs.com/wx/v1/station/data/timeseries/'

const validResponse: SnowObsTimeseriesResponse = {
  UNITS: { air_temp: 'fahrenheit' },
  VARIABLES: [{ variable: 'air_temp', long_name: 'Air Temperature' }],
  STATION: [
    {
      id: '4',
      stid: '4',
      name: 'Test Station',
      elevation: 1000,
      observations: { date_time: ['2026-07-07T00:00:00Z'], air_temp: [30] },
    },
  ],
}

const server = setupServer(http.get(TIMESERIES_URL, () => HttpResponse.json(validResponse)))

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

beforeEach(() => {
  process.env.SNOWOBS_TOKEN = 'test-token'
  // Error paths log via payload; return a stub logger so they don't hit the console fallback.
  jest
    .mocked(getPayload)
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    .mockResolvedValue({ logger: { error: jest.fn() } } as unknown as Payload)
})

describe('fetchStationTimeseries', () => {
  it('returns the validated timeseries on success', async () => {
    const result = await fetchStationTimeseries(['4'])
    expect(result.STATION[0].stid).toBe('4')
    expect(result.STATION[0].observations.air_temp).toEqual([30])
  })

  it('throws SnowObsError with the status on a non-2xx response', async () => {
    server.use(http.get(TIMESERIES_URL, () => new HttpResponse(null, { status: 500 })))
    await expect(fetchStationTimeseries(['4'])).rejects.toThrow(SnowObsError)
    await expect(fetchStationTimeseries(['4'])).rejects.toThrow(/status 500/)
  })

  it('wraps network failures in a SnowObsError', async () => {
    server.use(http.get(TIMESERIES_URL, () => HttpResponse.error()))
    await expect(fetchStationTimeseries(['4'])).rejects.toThrow(
      /Failed to fetch SnowObs station timeseries/,
    )
  })

  it('throws when SNOWOBS_TOKEN is not set', async () => {
    delete process.env.SNOWOBS_TOKEN
    await expect(fetchStationTimeseries(['4'])).rejects.toThrow(/SNOWOBS_TOKEN/)
  })
})
