const mockGetActiveForecastZones = jest.fn()
const mockGetAvalancheCenterPlatforms = jest.fn()

jest.mock('../../src/services/nac/nac', () => ({
  getActiveForecastZones: (...args: unknown[]) => mockGetActiveForecastZones(...args),
  getAvalancheCenterPlatforms: (...args: unknown[]) => mockGetAvalancheCenterPlatforms(...args),
}))

import { resolveBuiltInPages } from '@/collections/Tenants/endpoints/provisionTenant'

// @ts-expect-error - partial mock of pino Logger; only methods used in tests are provided
const mockLog: import('pino').Logger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

const navBuiltInPages = [
  { title: 'All Forecasts', url: '/forecasts/avalanche' },
  { title: 'Mountain Weather', url: '/weather/forecast' },
  { title: 'Weather Stations', url: '/weather/stations/map' },
  { title: 'Recent Observations', url: '/observations' },
  { title: 'Blog', url: '/blog' },
]

function makeZone(name: string, slug: string, rank: number) {
  return {
    slug,
    zone: {
      id: Math.floor(Math.random() * 1000),
      name,
      url: `/forecasts/${slug}`,
      zone_id: slug,
      config: {
        elevation_band_names: {
          lower: 'Below Treeline',
          middle: 'Near Treeline',
          upper: 'Above Treeline',
        },
      },
      status: 'active' as const,
      rank,
    },
  }
}

describe('resolveBuiltInPages', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetAvalancheCenterPlatforms.mockResolvedValue({ weather: false })
  })

  describe('forecast pages', () => {
    it('creates single forecast page for single-zone center', async () => {
      mockGetActiveForecastZones.mockResolvedValue([makeZone('Olympic', 'olympic', 1)])

      const { forecastPages } = await resolveBuiltInPages('test', navBuiltInPages, mockLog)

      expect(forecastPages).toEqual([
        { title: 'Avalanche Forecast', url: '/forecasts/avalanche/olympic' },
      ])
    })

    it('creates All Forecasts + per-zone pages for multi-zone center sorted by rank', async () => {
      mockGetActiveForecastZones.mockResolvedValue([
        makeZone('Zone B', 'zone-b', 2),
        makeZone('Zone A', 'zone-a', 1),
      ])

      const { forecastPages } = await resolveBuiltInPages('test', navBuiltInPages, mockLog)

      expect(forecastPages).toEqual([
        { title: 'All Forecasts', url: '/forecasts/avalanche' },
        { title: 'Zone A', url: '/forecasts/avalanche/zone-a' },
        { title: 'Zone B', url: '/forecasts/avalanche/zone-b' },
      ])
    })

    it('creates default All Forecasts page when AFP returns no zones', async () => {
      mockGetActiveForecastZones.mockResolvedValue([])

      const { forecastPages } = await resolveBuiltInPages('test', navBuiltInPages, mockLog)

      expect(forecastPages).toEqual([{ title: 'All Forecasts', url: '/forecasts/avalanche' }])
    })

    it('falls back to default All Forecasts page when AFP fails', async () => {
      mockGetActiveForecastZones.mockRejectedValue(new Error('network error'))

      const { forecastPages } = await resolveBuiltInPages('test', navBuiltInPages, mockLog)

      expect(forecastPages).toEqual([{ title: 'All Forecasts', url: '/forecasts/avalanche' }])
    })
  })

  describe('non-forecast pages', () => {
    beforeEach(() => {
      mockGetActiveForecastZones.mockResolvedValue([])
    })

    it('excludes forecast pages from non-forecast list', async () => {
      const { nonForecastPages } = await resolveBuiltInPages('test', navBuiltInPages, mockLog)

      expect(nonForecastPages.find((p) => p.url.startsWith('/forecasts/avalanche'))).toBeUndefined()
    })

    it('excludes Mountain Weather when center has no weather platform', async () => {
      mockGetAvalancheCenterPlatforms.mockResolvedValue({ weather: false })

      const { nonForecastPages } = await resolveBuiltInPages('test', navBuiltInPages, mockLog)

      expect(nonForecastPages.find((p) => p.url === '/weather/forecast')).toBeUndefined()
    })

    it('includes Mountain Weather when center has weather platform', async () => {
      mockGetAvalancheCenterPlatforms.mockResolvedValue({ weather: true })

      const { nonForecastPages } = await resolveBuiltInPages('test', navBuiltInPages, mockLog)

      expect(nonForecastPages).toContainEqual({
        title: 'Mountain Weather',
        url: '/weather/forecast',
      })
    })

    it('excludes Mountain Weather when NAC platforms query fails', async () => {
      mockGetAvalancheCenterPlatforms.mockRejectedValue(new Error('network error'))

      const { nonForecastPages } = await resolveBuiltInPages('test', navBuiltInPages, mockLog)

      expect(nonForecastPages.find((p) => p.url === '/weather/forecast')).toBeUndefined()
    })

    it('includes other DVAC nav pages unchanged', async () => {
      const { nonForecastPages } = await resolveBuiltInPages('test', navBuiltInPages, mockLog)

      expect(nonForecastPages).toContainEqual({
        title: 'Weather Stations',
        url: '/weather/stations/map',
      })
      expect(nonForecastPages).toContainEqual({
        title: 'Recent Observations',
        url: '/observations',
      })
      expect(nonForecastPages).toContainEqual({ title: 'Blog', url: '/blog' })
    })
  })
})
