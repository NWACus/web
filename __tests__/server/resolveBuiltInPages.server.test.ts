import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

jest.mock('../../src/payload.config', () => ({}))

// nac.ts internally calls getPayload({ config }) for logging. Give it a
// stub with a logger so error-path tests don't crash on logger access.
jest.mock('payload', () => ({
  getPayload: jest.fn().mockResolvedValue({
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  }),
}))

import { resolveBuiltInPages } from '@/collections/Tenants/endpoints/provisionTenant'

type ZoneInput = {
  name: string
  slug: string
  rank?: number | null
  id?: number
}

// Minimal but schema-compliant shape for the /v2/public/avalanche-center/:id
// response. Every required field in avalancheCenterSchema is populated with a
// sensible default; tests only need to pass in zones.
function makeCenterResponse(slug: string, zones: ZoneInput[]) {
  return {
    id: slug.toUpperCase(),
    name: slug.toUpperCase(),
    url: `/${slug}`,
    city: 'X',
    state: 'XX',
    timezone: 'America/Los_Angeles',
    email: 'x@example.com',
    phone: null,
    center_point: null,
    created_at: '2026-01-01T00:00:00Z',
    wkb_geometry: null,
    config: {
      expires_time: null,
      published_time: null,
      blog: false,
      blog_title: '',
      weather_table: [],
    },
    type: 'nonprofit',
    widget_config: {},
    zones: zones.map((z, i) => ({
      id: z.id ?? i + 1,
      name: z.name,
      url: `/forecasts/${z.slug}`,
      zone_id: z.slug,
      config: {
        elevation_band_names: { lower: 'Below', middle: 'Near', upper: 'Above' },
      },
      status: 'active',
      rank: z.rank ?? null,
    })),
    nws_zones: [],
    nws_offices: [],
    off_season: false,
  }
}

// /v1/public/avalanche-centers response used by getAvalancheCenterPlatforms.
function makeCapabilities(
  slug: string,
  overrides: { forecasts?: boolean; weather?: boolean } = {},
) {
  return {
    centers: [
      {
        id: slug.toUpperCase(),
        display_id: slug.toUpperCase(),
        platforms: {
          warnings: false,
          forecasts: overrides.forecasts ?? true,
          stations: false,
          obs: false,
          weather: overrides.weather ?? false,
        },
      },
    ],
  }
}

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// @ts-expect-error - partial mock of pino Logger; only methods used in tests are provided
const mockLog: import('pino').Logger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

const SLUG = 'test'

describe('resolveBuiltInPages', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('forecast pages', () => {
    it('creates single forecast page for single-zone center', async () => {
      server.use(
        http.get('https://forecasts.avalanche.org/', () =>
          HttpResponse.json(makeCapabilities(SLUG)),
        ),
        http.get(`https://api.avalanche.org/v2/public/avalanche-center/${SLUG.toUpperCase()}`, () =>
          HttpResponse.json(
            makeCenterResponse(SLUG, [{ name: 'Olympic', slug: 'olympic', rank: 1 }]),
          ),
        ),
      )

      const { forecastPages } = await resolveBuiltInPages(SLUG, mockLog)

      expect(forecastPages).toEqual([
        { title: 'Avalanche Forecast', url: '/forecasts/avalanche/olympic' },
      ])
    })

    it('creates All Forecasts + per-zone pages for multi-zone center sorted by rank', async () => {
      server.use(
        http.get('https://forecasts.avalanche.org/', () =>
          HttpResponse.json(makeCapabilities(SLUG)),
        ),
        http.get(`https://api.avalanche.org/v2/public/avalanche-center/${SLUG.toUpperCase()}`, () =>
          HttpResponse.json(
            makeCenterResponse(SLUG, [
              { name: 'Zone B', slug: 'zone-b', rank: 2 },
              { name: 'Zone A', slug: 'zone-a', rank: 1 },
            ]),
          ),
        ),
      )

      const { forecastPages } = await resolveBuiltInPages(SLUG, mockLog)

      expect(forecastPages).toEqual([
        { title: 'All Forecasts', url: '/forecasts/avalanche' },
        { title: 'Zone A', url: '/forecasts/avalanche/zone-a' },
        { title: 'Zone B', url: '/forecasts/avalanche/zone-b' },
      ])
    })

    it('creates default All Forecasts page when AFP returns no zones', async () => {
      server.use(
        http.get('https://forecasts.avalanche.org/', () =>
          HttpResponse.json(makeCapabilities(SLUG)),
        ),
        http.get(`https://api.avalanche.org/v2/public/avalanche-center/${SLUG.toUpperCase()}`, () =>
          HttpResponse.json(makeCenterResponse(SLUG, [])),
        ),
      )

      const { forecastPages } = await resolveBuiltInPages(SLUG, mockLog)

      expect(forecastPages).toEqual([{ title: 'All Forecasts', url: '/forecasts/avalanche' }])
    })

    it('falls back to default All Forecasts page when AFP fails', async () => {
      server.use(
        http.get('https://forecasts.avalanche.org/', () =>
          HttpResponse.json(makeCapabilities(SLUG)),
        ),
        http.get(
          `https://api.avalanche.org/v2/public/avalanche-center/${SLUG.toUpperCase()}`,
          () => new HttpResponse(null, { status: 500 }),
        ),
      )

      const { forecastPages } = await resolveBuiltInPages(SLUG, mockLog)

      expect(forecastPages).toEqual([{ title: 'All Forecasts', url: '/forecasts/avalanche' }])
    })
  })

  describe('non-forecast pages', () => {
    it('excludes forecast pages from non-forecast list', async () => {
      server.use(
        http.get('https://forecasts.avalanche.org/', () =>
          HttpResponse.json(makeCapabilities(SLUG, { weather: false })),
        ),
        http.get(`https://api.avalanche.org/v2/public/avalanche-center/${SLUG.toUpperCase()}`, () =>
          HttpResponse.json(makeCenterResponse(SLUG, [])),
        ),
      )

      const { nonForecastPages } = await resolveBuiltInPages(SLUG, mockLog)

      expect(nonForecastPages.find((p) => p.url.startsWith('/forecasts/avalanche'))).toBeUndefined()
    })

    it('excludes Mountain Weather when center has no weather platform', async () => {
      server.use(
        http.get('https://forecasts.avalanche.org/', () =>
          HttpResponse.json(makeCapabilities(SLUG, { weather: false })),
        ),
        http.get(`https://api.avalanche.org/v2/public/avalanche-center/${SLUG.toUpperCase()}`, () =>
          HttpResponse.json(makeCenterResponse(SLUG, [])),
        ),
      )

      const { nonForecastPages } = await resolveBuiltInPages(SLUG, mockLog)

      expect(nonForecastPages.find((p) => p.url === '/weather/forecast')).toBeUndefined()
    })

    it('includes Mountain Weather when center has weather platform', async () => {
      server.use(
        http.get('https://forecasts.avalanche.org/', () =>
          HttpResponse.json(makeCapabilities(SLUG, { weather: true })),
        ),
        http.get(`https://api.avalanche.org/v2/public/avalanche-center/${SLUG.toUpperCase()}`, () =>
          HttpResponse.json(makeCenterResponse(SLUG, [])),
        ),
      )

      const { nonForecastPages } = await resolveBuiltInPages(SLUG, mockLog)

      expect(nonForecastPages).toContainEqual({
        title: 'Mountain Weather',
        url: '/weather/forecast',
      })
    })

    it('excludes Mountain Weather when NAC platforms query fails', async () => {
      server.use(
        http.get('https://forecasts.avalanche.org/', () => new HttpResponse(null, { status: 500 })),
        http.get(`https://api.avalanche.org/v2/public/avalanche-center/${SLUG.toUpperCase()}`, () =>
          HttpResponse.json(makeCenterResponse(SLUG, [])),
        ),
      )

      const { nonForecastPages } = await resolveBuiltInPages(SLUG, mockLog)

      expect(nonForecastPages.find((p) => p.url === '/weather/forecast')).toBeUndefined()
    })

    it('includes the static BUILT_IN_PAGES list', async () => {
      server.use(
        http.get('https://forecasts.avalanche.org/', () =>
          HttpResponse.json(makeCapabilities(SLUG)),
        ),
        http.get(`https://api.avalanche.org/v2/public/avalanche-center/${SLUG.toUpperCase()}`, () =>
          HttpResponse.json(makeCenterResponse(SLUG, [])),
        ),
      )

      const { nonForecastPages } = await resolveBuiltInPages(SLUG, mockLog)

      expect(nonForecastPages).toContainEqual({
        title: 'Weather Stations',
        url: '/weather/stations/map',
      })
      expect(nonForecastPages).toContainEqual({
        title: 'Recent Observations',
        url: '/observations',
      })
      expect(nonForecastPages).toContainEqual({
        title: 'Submit Observations',
        url: '/observations/submit',
      })
      expect(nonForecastPages).toContainEqual({ title: 'Blog', url: '/blog' })
      expect(nonForecastPages).toContainEqual({ title: 'Events', url: '/events' })
    })
  })
})
