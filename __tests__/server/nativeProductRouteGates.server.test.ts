const mockGetNativeProductFlag = jest.fn()
jest.mock('../../src/utilities/getNativeProductFlag', () => ({
  getNativeProductFlag: (...a: unknown[]) => mockGetNativeProductFlag(...a),
}))

// Every upstream read these routes make; none may run while the product is off.
const mockUpstream = jest.fn()
jest.mock('../../src/services/nac/nac', () => ({
  getAvalancheCenterMetadata: (...a: unknown[]) => mockUpstream('metadata', ...a),
  fetchProductArchive: (...a: unknown[]) => mockUpstream('archive', ...a),
}))
jest.mock('../../src/services/nac/resolveZone', () => ({
  resolveZoneFromSlug: (...a: unknown[]) => mockUpstream('zone', ...a),
}))
jest.mock('../../src/services/nac/dangerMap/mapLayer', () => ({
  getZoneMapLayer: (...a: unknown[]) => mockUpstream('mapLayer', ...a),
}))
jest.mock('../../src/services/snowobs/snowobs', () => ({
  fetchCurrentStationData: (...a: unknown[]) => mockUpstream('current', ...a),
  fetchWebcams: (...a: unknown[]) => mockUpstream('webcams', ...a),
}))
jest.mock('../../src/services/snowobs/stationMap/alternateZones', () => ({
  fetchAlternateZones: (...a: unknown[]) => mockUpstream('alternateZones', ...a),
}))
jest.mock('../../src/services/stations/getStationPages', () => ({
  getStationPages: (...a: unknown[]) => mockUpstream('stationPages', ...a),
  toPageSummaries: () => [],
}))

import { GET as dangerMap } from '@/app/api/[center]/danger-map/route'
import { GET as forecastArchive } from '@/app/api/[center]/forecast-archive/route'
import { GET as stationMap } from '@/app/api/[center]/station-map/route'
import { NextRequest } from 'next/server'

const params = Promise.resolve({ center: 'nwac' })

beforeEach(() => {
  mockGetNativeProductFlag.mockReset()
  mockGetNativeProductFlag.mockResolvedValue(false)
})

describe.each([
  [
    'danger-map',
    'dangerMap',
    () => dangerMap(new NextRequest('http://x/api/nwac/danger-map'), { params }),
  ],
  [
    'station-map',
    'stationMap',
    () => stationMap(new NextRequest('http://x/api/nwac/station-map'), { params }),
  ],
  [
    'forecast-archive',
    'forecast',
    () =>
      forecastArchive(
        new NextRequest('http://x/api/nwac/forecast-archive?zone=z&from=2026-01-01&to=2026-01-31'),
        { params },
      ),
  ],
])('%s', (_route, product, call) => {
  it(`404s without reading upstream when the center has native ${product} off`, async () => {
    const res = await call()

    expect(res.status).toBe(404)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
    expect(mockGetNativeProductFlag).toHaveBeenCalledWith('nwac', product)
    expect(mockUpstream).not.toHaveBeenCalled()
  })
})

it('forecast-archive answers 502 rather than throwing when upstream fails', async () => {
  mockGetNativeProductFlag.mockResolvedValue(true)
  mockUpstream.mockRejectedValue(new Error('NAC down'))

  const res = await forecastArchive(
    new NextRequest('http://x/api/nwac/forecast-archive?zone=z&from=2026-01-01&to=2026-01-31'),
    { params },
  )

  expect(res.status).toBe(502)
})
