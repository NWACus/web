import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

jest.mock('../../src/payload.config', () => ({}))

jest.mock('payload', () => ({
  getPayload: jest.fn(),
}))

const getMetadataMock = jest.fn()
jest.mock('../../src/services/nac/nac', () => ({
  getAvalancheCenterMetadata: () => getMetadataMock(),
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

// Only `widget_config.stations.token` is read; the rest of the center metadata is irrelevant here.
function mockAfpToken(token: string | undefined): void {
  getMetadataMock.mockResolvedValue({ widget_config: { stations: token ? { token } : {} } })
}

function captureTokenParam(): string[] {
  const seen: string[] = []
  server.use(
    http.get(TIMESERIES_URL, ({ request }) => {
      seen.push(new URL(request.url).searchParams.get('token') ?? '')
      return HttpResponse.json(validResponse)
    }),
  )
  return seen
}

beforeEach(() => {
  mockAfpToken('afp-token')
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

  it('requests unrounded values only when rawData is set', async () => {
    const seenParams: (string | null)[] = []
    server.use(
      http.get(TIMESERIES_URL, ({ request }) => {
        seenParams.push(new URL(request.url).searchParams.get('raw_data'))
        return HttpResponse.json(validResponse)
      }),
    )
    await fetchStationTimeseries(['4'], { rawData: true })
    await fetchStationTimeseries(['4'])
    expect(seenParams).toEqual(['true', null])
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

  it("takes the token from the center's AFP config", async () => {
    const seen = captureTokenParam()
    await fetchStationTimeseries(['4'])
    expect(seen).toEqual(['afp-token'])
  })

  it('throws when the AFP config carries no token', async () => {
    mockAfpToken(undefined)
    await expect(fetchStationTimeseries(['4'])).rejects.toThrow(
      /No SnowObs token in the AFP config/,
    )
  })
})
