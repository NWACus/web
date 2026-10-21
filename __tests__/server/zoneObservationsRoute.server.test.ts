const mockShowsTabs = jest.fn()
const mockGetZoneObservations = jest.fn()
jest.mock('../../src/services/nac/zoneObservations', () => ({
  showsZoneObservationTabs: (...a: unknown[]) => mockShowsTabs(...a),
  getZoneObservations: (...a: unknown[]) => mockGetZoneObservations(...a),
}))

const mockResolveZone = jest.fn()
jest.mock('../../src/services/nac/resolveZone', () => ({
  resolveZoneFromSlug: (...a: unknown[]) => mockResolveZone(...a),
}))

jest.mock('../../src/services/nac/nac', () => ({
  getAvalancheCenterMetadata: async () => ({ id: 'SNFAC', timezone: 'America/Boise' }),
  logNacError: jest.fn(),
}))

jest.mock('../../src/utilities/getNativeProductFlag', () => ({
  getNativeProductFlag: async () => true,
}))

import { GET } from '@/app/api/[center]/zone-observations/route'
import { NextRequest } from 'next/server'

const params = Promise.resolve({ center: 'snfac' })
const request = (query: string) => new NextRequest(`http://x/api/snfac/zone-observations${query}`)

const galena = { slug: 'galena', zone: { id: 2904, name: 'Galena Summit & Eastern Mtns' } }
const week = { window: { from: '2026-02-24', to: '2026-03-02' }, observations: [], avalanches: [] }

beforeEach(() => {
  jest.clearAllMocks()
  mockShowsTabs.mockResolvedValue(true)
  mockResolveZone.mockResolvedValue(galena)
  mockGetZoneObservations.mockResolvedValue(week)
})

it('answers the zone’s week with an edge-cacheable response', async () => {
  const res = await GET(request('?zone=galena'), { params })

  expect(res.status).toBe(200)
  expect(res.headers.get('Cache-Control')).toBe(
    'public, max-age=0, s-maxage=300, stale-while-revalidate=60',
  )
  expect(await res.json()).toEqual(week)
  expect(mockGetZoneObservations).toHaveBeenCalledWith('SNFAC', 2904, 'America/Boise')
})

it('404s when the center has the tabs off, without reading upstream', async () => {
  mockShowsTabs.mockResolvedValue(false)

  const res = await GET(request('?zone=galena'), { params })

  expect(res.status).toBe(404)
  expect(mockGetZoneObservations).not.toHaveBeenCalled()
})

it.each([
  ['without a zone', ''],
  ['for an unknown zone', '?zone=nope'],
])('404s %s', async (_case, query) => {
  mockResolveZone.mockResolvedValue(null)

  const res = await GET(request(query), { params })

  expect(res.status).toBe(404)
  expect(res.headers.get('Cache-Control')).toBe('no-store')
})

it('answers 502, uncached, when upstream fails', async () => {
  mockGetZoneObservations.mockRejectedValue(new Error('obs API down'))

  const res = await GET(request('?zone=galena'), { params })

  expect(res.status).toBe(502)
  expect(res.headers.get('Cache-Control')).toBe('no-store')
})
