import type { ActiveForecastZoneWithSlug } from '../../src/services/nac/nac'
import { AvalancheForecastZoneStatus } from '../../src/services/nac/types/schemas'

const mockGetActiveForecastZones = jest.fn()

jest.mock('../../src/services/nac/nac', () => ({
  getActiveForecastZones: (...args: unknown[]) => mockGetActiveForecastZones(...args),
}))

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { resolveZoneFromSlug } = require('../../src/services/nac/resolveZone')

const mockZoneConfig = {
  elevation_band_names: {
    lower: 'Below Treeline',
    middle: 'Near Treeline',
    upper: 'Above Treeline',
  },
}

const mockZones: ActiveForecastZoneWithSlug[] = [
  {
    slug: 'west-slopes-north',
    zone: {
      status: AvalancheForecastZoneStatus.Active,
      id: 1001,
      name: 'West Slopes North',
      url: '/forecasts/west-slopes-north',
      rank: 1,
      zone_id: 'WSN',
      config: mockZoneConfig,
    },
  },
  {
    slug: 'east-slopes-north',
    zone: {
      status: AvalancheForecastZoneStatus.Active,
      id: 1002,
      name: 'East Slopes North',
      url: '/forecasts/east-slopes-north',
      rank: 2,
      zone_id: 'ESN',
      config: mockZoneConfig,
    },
  },
]

beforeEach(() => {
  mockGetActiveForecastZones.mockReset()
  mockGetActiveForecastZones.mockResolvedValue(mockZones)
})

describe('resolveZoneFromSlug', () => {
  it('returns the correct zone for a valid slug', async () => {
    const result = await resolveZoneFromSlug('nwac', 'west-slopes-north')

    expect(result).not.toBeNull()
    expect(result?.slug).toBe('west-slopes-north')
    expect(result?.zone.id).toBe(1001)
    expect(result?.zone.name).toBe('West Slopes North')
  })

  it('returns null for an unknown slug', async () => {
    const result = await resolveZoneFromSlug('nwac', 'nonexistent-zone')

    expect(result).toBeNull()
  })

  it('applies DVAC alias — passes nwac to getActiveForecastZones', async () => {
    await resolveZoneFromSlug('dvac', 'west-slopes-north')

    expect(mockGetActiveForecastZones).toHaveBeenCalledWith('nwac')
  })

  it('DVAC alias resolves the correct zone', async () => {
    const result = await resolveZoneFromSlug('dvac', 'east-slopes-north')

    expect(result).not.toBeNull()
    expect(result?.slug).toBe('east-slopes-north')
    expect(result?.zone.id).toBe(1002)
  })

  it('passes through non-dvac center slugs unchanged', async () => {
    await resolveZoneFromSlug('sac', 'some-zone')

    expect(mockGetActiveForecastZones).toHaveBeenCalledWith('sac')
  })

  it('returns null when no zones exist for the center', async () => {
    mockGetActiveForecastZones.mockResolvedValue([])

    const result = await resolveZoneFromSlug('nwac', 'west-slopes-north')

    expect(result).toBeNull()
  })
})
