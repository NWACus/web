import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

jest.mock('../../src/payload.config', () => ({}))

jest.mock('payload', () => ({
  getPayload: jest.fn(),
}))

import { getForecastZoneDanger } from '@/services/nac/nac'

const stevensPass = {
  name: 'Stevens Pass',
  center_id: 'NWAC',
  danger: 'considerable',
  danger_level: 3,
  travel_advice: 'Dangerous avalanche conditions.',
  color: '#f7941e',
  font_color: '#ffffff',
  link: 'http://www.nwac.us/avalanche-forecast/#/stevens-pass',
  off_season: false,
}

const olympics = {
  name: 'Olympics',
  center_id: 'NWAC',
  danger: 'no rating',
  danger_level: -1,
  travel_advice: 'Watch for signs of unstable snow.',
  color: '#888888',
  font_color: '#ffffff',
  link: 'http://www.nwac.us/avalanche-forecast/#/olympics',
  off_season: true,
}

const mapLayerResponse = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: { type: 'Polygon', coordinates: [] }, properties: stevensPass },
    { type: 'Feature', geometry: { type: 'Polygon', coordinates: [] }, properties: olympics },
  ],
  start_time: '2026-01-01T00:00:00',
  end_time: '2026-01-02T00:00:00',
}

const requestedCenters: string[] = []

const server = setupServer(
  http.get('https://api.avalanche.org/v2/public/products/map-layer/:center', ({ params }) => {
    requestedCenters.push(String(params.center))
    return HttpResponse.json(mapLayerResponse)
  }),
)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  requestedCenters.length = 0
})
afterAll(() => server.close())

describe('services: getForecastZoneDanger', () => {
  it('returns the danger properties for a zone matched by its url slug', async () => {
    const danger = await getForecastZoneDanger('nwac', 'stevens-pass')
    expect(danger).not.toBeNull()
    expect(danger?.danger_level).toBe(3)
    expect(danger?.danger).toBe('considerable')
    expect(danger?.travel_advice).toBe('Dangerous avalanche conditions.')
  })

  it('returns no-rating zone properties (off-season danger_level -1)', async () => {
    const danger = await getForecastZoneDanger('nwac', 'olympics')
    expect(danger?.danger_level).toBe(-1)
    expect(danger?.travel_advice).toBe('Watch for signs of unstable snow.')
  })

  it('returns null when no zone matches the slug', async () => {
    const danger = await getForecastZoneDanger('nwac', 'does-not-exist')
    expect(danger).toBeNull()
  })

  it('requests the upstream map-layer for the uppercased center', async () => {
    await getForecastZoneDanger('nwac', 'stevens-pass')
    expect(requestedCenters).toContain('NWAC')
  })

  it('maps the dvac center to nwac upstream', async () => {
    await getForecastZoneDanger('dvac', 'stevens-pass')
    expect(requestedCenters).toContain('NWAC')
  })
})
