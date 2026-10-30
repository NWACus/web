import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

import { setupMswLifecycle } from '../helpers/mswLifecycle'

jest.mock('../../src/payload.config', () => ({}))

jest.mock('payload', () => ({
  getPayload: jest.fn(),
}))

const getMetadataMock = jest.fn()
jest.mock('../../src/services/nac/nac', () => ({
  getAvalancheCenterMetadata: () => getMetadataMock(),
}))

import {
  fetchCurrentStationData,
  fetchStationTimeseries,
  fetchWebcams,
  SnowObsError,
} from '@/services/snowobs/snowobs'
import type { SnowObsTimeseriesResponse } from '@/services/snowobs/types/schemas'
import type { Payload } from 'payload'
import { getPayload } from 'payload'

const TIMESERIES_URL = 'https://api.snowobs.com/wx/v1/station/data/timeseries/'
const CURRENT_URL = 'https://api.snowobs.com/wx/v1/station/data/current/'
const WEBCAM_URL = 'https://api.snowobs.com/v1/webcam'

const ref = (stid: string, source = 'nwac') => ({ stid, source })

const validResponse: SnowObsTimeseriesResponse = {
  UNITS: { air_temp: 'fahrenheit' },
  VARIABLES: [{ variable: 'air_temp', long_name: 'Air Temperature' }],
  STATION: [
    {
      id: '4',
      stid: '4',
      source: 'nwac',
      name: 'Test Station',
      elevation: 1000,
      observations: { date_time: ['2026-07-07T00:00:00Z'], air_temp: [30] },
    },
  ],
}

const server = setupServer(http.get(TIMESERIES_URL, () => HttpResponse.json(validResponse)))

setupMswLifecycle(server)

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
  it('sends every source once and every stid, so one request spans sources', async () => {
    const seen: URLSearchParams[] = []
    server.use(
      http.get(TIMESERIES_URL, ({ request }) => {
        seen.push(new URL(request.url).searchParams)
        return HttpResponse.json(validResponse)
      }),
    )
    await fetchStationTimeseries('nwac', [ref('1'), ref('1011', 'snotel'), ref('2')])
    expect(seen[0].get('source')).toBe('nwac,snotel')
    expect(seen[0].get('stid')).toBe('1,1011,2')
  })

  it('returns the validated timeseries on success', async () => {
    const result = await fetchStationTimeseries('nwac', [ref('4')])
    expect(result.STATION[0].stid).toBe('4')
    expect(result.STATION[0].observations.air_temp).toEqual([30])
  })

  it("reads the center's default units, or SnowObs's metric, never raw data", async () => {
    const seenParams: [string | null, string | null][] = []
    server.use(
      http.get(TIMESERIES_URL, ({ request }) => {
        const params = new URL(request.url).searchParams
        seenParams.push([params.get('raw_data'), params.get('units')])
        return HttpResponse.json(validResponse)
      }),
    )
    await fetchStationTimeseries('nwac', [ref('4')])
    await fetchStationTimeseries('nwac', [ref('4')], { units: 'metric' })
    expect(seenParams).toEqual([
      [null, 'default'],
      [null, 'metric'],
    ])
  })

  it('reads a unit its stations disagree on as unknown', async () => {
    server.use(
      http.get(TIMESERIES_URL, () =>
        HttpResponse.json({
          ...validResponse,
          UNITS: {
            ...validResponse.UNITS,
            pressure: [
              { stid: null, unit: 'millibar' },
              { stid: null, unit: 'inch_Hg' },
            ],
          },
        }),
      ),
    )
    const result = await fetchStationTimeseries('nwac', [ref('4')])
    expect(result.UNITS).toEqual({ air_temp: 'fahrenheit', pressure: '' })
  })

  it('reads object-valued readings, like raw cloud layers, as null', async () => {
    const station = validResponse.STATION[0]
    server.use(
      http.get(TIMESERIES_URL, () =>
        HttpResponse.json({
          ...validResponse,
          STATION: [
            {
              ...station,
              observations: {
                ...station.observations,
                cloud_layer_1: [{ sky_condition: 'clear', height_agl: null }],
              },
            },
          ],
        }),
      ),
    )
    const result = await fetchStationTimeseries('nwac', [ref('4')])
    expect(result.STATION[0].observations.cloud_layer_1).toEqual([null])
    expect(result.STATION[0].observations.air_temp).toEqual([30])
  })

  it('treats a 404 (no station left) as an empty timeseries', async () => {
    server.use(
      http.get(TIMESERIES_URL, () =>
        HttpResponse.json({ detail: 'No stations found matching the request' }, { status: 404 }),
      ),
    )
    const result = await fetchStationTimeseries('nwac', [ref('999999')])
    expect(result.STATION).toEqual([])
  })

  it('throws SnowObsError with the status on a non-2xx response', async () => {
    server.use(http.get(TIMESERIES_URL, () => new HttpResponse(null, { status: 500 })))
    await expect(fetchStationTimeseries('nwac', [ref('4')])).rejects.toThrow(SnowObsError)
    await expect(fetchStationTimeseries('nwac', [ref('4')])).rejects.toThrow(/status 500/)
  })

  it('wraps network failures in a SnowObsError', async () => {
    server.use(http.get(TIMESERIES_URL, () => HttpResponse.error()))
    await expect(fetchStationTimeseries('nwac', [ref('4')])).rejects.toThrow(
      /Failed to fetch SnowObs station timeseries/,
    )
  })

  it('sends an Origin, so it never caches a CORS-less response for the widget', async () => {
    const origins: (string | null)[] = []
    server.use(
      http.get(TIMESERIES_URL, ({ request }) => {
        origins.push(request.headers.get('origin'))
        return HttpResponse.json(validResponse)
      }),
    )
    await fetchStationTimeseries('nwac', [ref('4')])
    expect(origins).toEqual(['https://avy-fx.org'])
  })

  describe('caching', () => {
    // 10:09:30 UTC; SnowObs dates are minute-granular.
    const now = Date.UTC(2026, 8, 28, 10, 9, 30)
    let fetchSpy: jest.SpyInstance

    beforeEach(() => {
      jest.spyOn(Date, 'now').mockReturnValue(now)
      fetchSpy = jest.spyOn(global, 'fetch')
    })
    afterEach(() => jest.restoreAllMocks())

    function captureEndDates(): (string | null)[] {
      const seen: (string | null)[] = []
      server.use(
        http.get(TIMESERIES_URL, ({ request }) => {
          seen.push(new URL(request.url).searchParams.get('end_date'))
          return HttpResponse.json(validResponse)
        }),
      )
      return seen
    }

    it('is uncached by default and ends the window now', async () => {
      const ends = captureEndDates()
      await fetchStationTimeseries('nwac', [ref('4')])
      expect(ends).toEqual(['202609281009'])
      expect(fetchSpy.mock.calls[0][1]).toMatchObject({ cache: 'no-store' })
    })

    it('floors the end to the bucket only when a revalidate is asked for', async () => {
      const ends = captureEndDates()
      await fetchStationTimeseries('nwac', [ref('4')], { revalidate: 600 })
      expect(ends).toEqual(['202609281000'])
      expect(fetchSpy.mock.calls[0][1]).toMatchObject({ next: { revalidate: 600 } })
    })
  })

  it("takes the token from the center's AFP config", async () => {
    const seen = captureTokenParam()
    await fetchStationTimeseries('nwac', [ref('4')])
    expect(seen).toEqual(['afp-token'])
  })

  it('throws when the AFP config carries no token', async () => {
    mockAfpToken(undefined)
    await expect(fetchStationTimeseries('nwac', [ref('4')])).rejects.toThrow(
      /No SnowObs token in the AFP config/,
    )
  })
})

/**
 * The station map's two reads fail independently of the station pages' timeseries read, so the
 * one logger they share has to name the call site it was reached from.
 */
describe('the station map fetches', () => {
  // SnowObs caches by URL alone and only adds CORS headers for a request with an Origin; an
  // Origin-less fetch of the widget's URL would break the widget in browsers for a minute.
  it("send an Origin, so they never refill SnowObs's cache without CORS headers", async () => {
    const origins: (string | null)[] = []
    const record = ({ request }: { request: Request }) => {
      origins.push(request.headers.get('origin'))
    }
    server.use(
      http.get(CURRENT_URL, (info) => {
        record(info)
        return HttpResponse.json({
          type: 'FeatureCollection',
          features: [],
          properties: { variables: [], units: {} },
        })
      }),
      http.get(WEBCAM_URL, (info) => {
        record(info)
        return HttpResponse.json({ webcam: [] })
      }),
    )

    await fetchCurrentStationData('sac')
    await fetchWebcams('sac')

    expect(origins).toEqual(['https://avy-fx.org', 'https://avy-fx.org'])
  })
})

describe('failure logging', () => {
  function captureLoggedErrors(): jest.Mock {
    const error = jest.fn()
    jest
      .mocked(getPayload)
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      .mockResolvedValue({ logger: { error } } as unknown as Payload)
    return error
  }

  it('names a current-data failure after that fetch', async () => {
    const logged = captureLoggedErrors()
    server.use(http.get(CURRENT_URL, () => new HttpResponse(null, { status: 500 })))

    await expect(fetchCurrentStationData('sac')).rejects.toThrow(SnowObsError)
    expect(logged).toHaveBeenCalledWith(
      expect.objectContaining({ centerSlug: 'sac', units: 'default' }),
      'fetchCurrentStationData error',
    )
  })

  it('names a webcam failure after that fetch', async () => {
    const logged = captureLoggedErrors()
    server.use(http.get(WEBCAM_URL, () => new HttpResponse(null, { status: 500 })))

    await expect(fetchWebcams('sac')).rejects.toThrow(SnowObsError)
    expect(logged).toHaveBeenCalledWith(
      expect.objectContaining({ centerSlug: 'sac' }),
      'fetchWebcams error',
    )
  })

  it('still names a timeseries failure after the timeseries fetch', async () => {
    const logged = captureLoggedErrors()
    server.use(http.get(TIMESERIES_URL, () => new HttpResponse(null, { status: 500 })))

    await expect(fetchStationTimeseries('nwac', [ref('4')])).rejects.toThrow(SnowObsError)
    expect(logged).toHaveBeenCalledWith(
      expect.objectContaining({ stids: ['4'] }),
      'fetchStationTimeseries error',
    )
  })
})
