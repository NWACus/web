const mockGetZoneMapLayer = jest.fn()
jest.mock('../../src/services/nac/dangerMap/mapLayer', () => ({
  getZoneMapLayer: (...a: unknown[]) => mockGetZoneMapLayer(...a),
}))

const mockAfpFetch = jest.fn()
const mockLogNacError = jest.fn()
jest.mock('../../src/services/nac/nac', () => ({
  afpFetch: (...a: unknown[]) => mockAfpFetch(...a),
  logNacError: (...a: unknown[]) => mockLogNacError(...a),
}))

jest.mock('../../src/utilities/getNativeProductFlag', () => ({
  getNativeProductFlag: async () => true,
}))

import { GET } from '@/app/api/[center]/danger-map/route'
import type { ZoneRenderFeature } from '@/services/nac/dangerMap/dangerMapZones'
import {
  infoExchangeCenterIds,
  PLATFORMS_TIMEOUT_MS,
} from '@/services/nac/dangerMap/infoExchangeCenters'
import type { ZoneFeature } from '@/services/nac/model/mapLayer'
import type { AvalancheCenterPlatforms } from '@/services/nac/types/schemas'
import { NextRequest } from 'next/server'

const params = Promise.resolve({ center: 'nwac' })
const request = () => new NextRequest('http://x/api/nwac/danger-map?allCenters=true')

const platforms = (forecasts: boolean, obs: boolean): AvalancheCenterPlatforms => ({
  warnings: false,
  forecasts,
  stations: false,
  obs,
  weather: false,
  nwac_weather: false,
})

function feature(id: number, centerId: string): ZoneFeature {
  return {
    type: 'Feature',
    id,
    geometry: { type: 'Polygon', coordinates: [] },
    properties: {
      name: `Zone ${id}`,
      center: null,
      center_link: '',
      timezone: 'America/Los_Angeles',
      center_id: centerId,
      state: 'WA',
      off_season: false,
      travel_advice: '',
      danger: 'no rating',
      danger_level: 0,
      color: '#888888',
      stroke: '#484848',
      font_color: '#ffffff',
      link: '',
      start_date: null,
      end_date: null,
      warning: { product: null },
    },
  }
}

async function infoExchangeByCenter(res: Response): Promise<Record<string, boolean>> {
  const body: { features: ZoneRenderFeature[] } = await res.json()
  return Object.fromEntries(
    body.features.map((f) => [f.properties.center_id, f.properties.infoExchange]),
  )
}

/** With the feed read, SOAIX's zone is the exchange and the response takes the full cache window. */
async function expectSoaixMarkedCachedFully(res: Response) {
  expect(res.status).toBe(200)
  expect(res.headers.get('Cache-Control')).toBe('public, max-age=0, s-maxage=300')
  expect(await infoExchangeByCenter(res)).toEqual({ NWAC: false, SOAIX: true })
}

/** Without the feed the zones still come back, none framed as an exchange, on a short cache. */
async function expectOrdinaryZonesCachedBriefly(res: Response) {
  expect(res.status).toBe(200)
  expect(res.headers.get('Cache-Control')).toBe('public, max-age=0, s-maxage=60')
  expect(await infoExchangeByCenter(res)).toEqual({ NWAC: false, SOAIX: false })
}

beforeEach(() => {
  jest.clearAllMocks()
  mockGetZoneMapLayer.mockResolvedValue({
    type: 'FeatureCollection',
    features: [feature(1, 'NWAC'), feature(2, 'SOAIX')],
  })
  mockAfpFetch.mockResolvedValue({
    centers: [
      { id: 'NWAC', platforms: platforms(true, true) },
      { id: 'SOAIX', platforms: platforms(false, true) },
    ],
  })
})

afterEach(() => {
  jest.useRealTimers()
})

describe('danger-map route — information exchanges', () => {
  it('marks the zones of centers the platforms feed describes as exchanges', async () => {
    await expectSoaixMarkedCachedFully(await GET(request(), { params }))
  })

  // The widget reads the feed row by row; one bad row must not hide every exchange.
  it('skips a malformed center row and still marks the others', async () => {
    mockAfpFetch.mockResolvedValue({
      centers: [
        { id: 'NWAC', platforms: { forecasts: true } },
        { id: 'SOAIX', platforms: platforms(false, true) },
      ],
    })

    await expectSoaixMarkedCachedFully(await GET(request(), { params }))
  })

  it('still serves the zones when the feed fails, logs it, and caches briefly', async () => {
    mockAfpFetch.mockRejectedValue(new Error('feed down'))

    const res = await GET(request(), { params })

    await expectOrdinaryZonesCachedBriefly(res)
    expect(mockLogNacError).toHaveBeenCalledTimes(1)
  })

  it('stops waiting on a hung feed so the zones are not held back', async () => {
    jest.useFakeTimers()
    mockAfpFetch.mockReturnValue(new Promise(() => {}))

    const pending = GET(request(), { params })
    await jest.advanceTimersByTimeAsync(PLATFORMS_TIMEOUT_MS)
    const res = await pending

    await expectOrdinaryZonesCachedBriefly(res)
  })
})

describe('infoExchangeCenterIds', () => {
  it('reads exchanges from the platforms feed: observations without forecasts', () => {
    const feed = new Map([
      ['NWAC', platforms(true, true)],
      ['EWYAIX', platforms(false, true)],
    ])

    expect(infoExchangeCenterIds(['NWAC', 'EWYAIX'], feed)).toEqual(new Set(['EWYAIX']))
  })

  // EWYAIX forecasts now; the id suffix no longer says anything.
  it('ignores the AIX suffix', () => {
    expect(infoExchangeCenterIds(['SOAIX'], new Map([['SOAIX', platforms(true, true)]]))).toEqual(
      new Set(),
    )
  })

  it('treats a center the feed does not describe, or a missing feed, as ordinary', () => {
    expect(infoExchangeCenterIds(['SOAIX', 'NWAC'], new Map())).toEqual(new Set())
    expect(infoExchangeCenterIds(['SOAIX'], null)).toEqual(new Set())
  })
})
