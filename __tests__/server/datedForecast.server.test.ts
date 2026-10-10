import type { ArchiveProductSummary } from '../../src/services/nac/archiveDates'
import { findDatedForecast } from '../../src/services/nac/datedForecast'

const mockResolveDatedZoneFromSlug = jest.fn()
const mockGetAvalancheCenterMetadata = jest.fn()
const mockFetchProductArchive = jest.fn()
const mockFetchProductById = jest.fn()

// Hoisted above the imports by jest, so the module under test sees these.
jest.mock('../../src/services/nac/resolveZone', () => ({
  resolveDatedZoneFromSlug: (...args: unknown[]) => mockResolveDatedZoneFromSlug(...args),
}))
jest.mock('../../src/services/nac/nac', () => ({
  getAvalancheCenterMetadata: (...args: unknown[]) => mockGetAvalancheCenterMetadata(...args),
  fetchProductArchive: (...args: unknown[]) => mockFetchProductArchive(...args),
  fetchProductById: (...args: unknown[]) => mockFetchProductById(...args),
}))

const RETIRED_ZONE_ID = 1301

const archiveEntry: ArchiveProductSummary = {
  id: 90210,
  product_type: 'forecast',
  published_time: '2024-01-05T14:00:00+00:00',
  danger_rating: 2,
  danger_level_text: 'moderate',
  current_danger: null,
  author: null,
  expires_time: '2024-01-06T01:00:00+00:00',
  updated_at: '2024-01-05T14:00:00+00:00',
  forecast_zone: [{ id: RETIRED_ZONE_ID }],
}

describe('findDatedForecast', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetAvalancheCenterMetadata.mockResolvedValue({ timezone: 'America/Denver' })
    mockFetchProductArchive.mockResolvedValue([archiveEntry])
    mockFetchProductById.mockResolvedValue({ id: archiveEntry.id, bottom_line: '<p>Retired.</p>' })
  })

  it("finds a retired zone's product, as the dated page does", async () => {
    mockResolveDatedZoneFromSlug.mockResolvedValue({
      slug: 'whitefish-range',
      active: false,
      zone: { id: RETIRED_ZONE_ID },
    })

    const forecast = await findDatedForecast('fac', 'whitefish-range', '2024-01-05')

    expect(mockResolveDatedZoneFromSlug).toHaveBeenCalledWith('fac', 'whitefish-range')
    expect(mockFetchProductById).toHaveBeenCalledWith(archiveEntry.id)
    expect(forecast).toEqual({ id: archiveEntry.id, bottom_line: '<p>Retired.</p>' })
  })

  it('returns null when the slug resolves to no zone', async () => {
    mockResolveDatedZoneFromSlug.mockResolvedValue(null)

    expect(await findDatedForecast('fac', 'nowhere', '2024-01-05')).toBeNull()
    expect(mockFetchProductById).not.toHaveBeenCalled()
  })
})
