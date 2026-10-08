import type { ActiveForecastZoneWithSlug, AvalancheCenterZone } from '../../src/services/nac/nac'
import {
  resolveDatedZoneFromSlug,
  resolveZoneFromSlug,
  retiredZoneForSlug,
} from '../../src/services/nac/resolveZone'
import { AvalancheForecastZoneStatus } from '../../src/services/nac/types/schemas'

const mockGetActiveForecastZones = jest.fn()
const mockGetAvalancheCenterMetadata = jest.fn()

// Hoisted above the imports by jest, so the module under test sees these.
jest.mock('../../src/services/nac/nac', () => ({
  getActiveForecastZones: (...args: unknown[]) => mockGetActiveForecastZones(...args),
  getAvalancheCenterMetadata: (...args: unknown[]) => mockGetAvalancheCenterMetadata(...args),
}))

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

/** A retired zone as center metadata lists it. */
function retired(
  id: number,
  name: string,
  url: string | null,
  withConfig = true,
): AvalancheCenterZone {
  return {
    status: AvalancheForecastZoneStatus.Disabled,
    id,
    name,
    zone_id: name.toLowerCase(),
    url,
    config: withConfig ? mockZoneConfig : undefined,
  }
}

describe('retiredZoneForSlug', () => {
  const active = mockZones.map((z) => z.zone)

  it('resolves a retired zone by the slug at the end of its URL', () => {
    const zones = [...active, retired(3039, 'Whitefish Range', 'https://fac.org/#/whitefish-range')]

    expect(retiredZoneForSlug(zones, 'whitefish-range')).toEqual({
      slug: 'whitefish-range',
      active: false,
      zone: {
        id: 3039,
        name: 'Whitefish Range',
        zone_id: 'whitefish range',
        config: mockZoneConfig,
      },
    })
  })

  it('leaves a slug an active zone also uses to that zone', () => {
    const zones = [...active, retired(3027, 'Old WSN', 'https://nwac.us/current/west-slopes-north')]

    expect(retiredZoneForSlug(zones, 'west-slopes-north')).toBeNull()
  })

  it('gives no address to retired zones that share a URL', () => {
    const zones = [
      retired(2323, 'Hillmans Highway', 'https://mwac.org/advisory/'),
      retired(2324, 'Lower Snowfields', 'https://mwac.org/advisory/'),
    ]

    expect(retiredZoneForSlug(zones, 'advisory')).toBeNull()
  })

  it('gives no address to a retired zone without a URL or band names', () => {
    expect(retiredZoneForSlug([retired(3013, 'PAC Advisory Area', null)], 'null')).toBeNull()
    expect(
      retiredZoneForSlug([retired(3012, 'PAC', 'https://pac.org/#/pac', false)], 'pac'),
    ).toBeNull()
  })
})

describe('resolveDatedZoneFromSlug', () => {
  it('prefers an active zone, marked active', async () => {
    const result = await resolveDatedZoneFromSlug('nwac', 'west-slopes-north')

    expect(result).toMatchObject({ slug: 'west-slopes-north', active: true, zone: { id: 1001 } })
    expect(mockGetAvalancheCenterMetadata).not.toHaveBeenCalled()
  })

  it('falls back to the center’s retired zones', async () => {
    mockGetAvalancheCenterMetadata.mockResolvedValue({
      zones: [retired(3039, 'Whitefish Range', 'https://fac.org/#/whitefish-range')],
    })

    const result = await resolveDatedZoneFromSlug('fac', 'whitefish-range')

    expect(result).toMatchObject({ active: false, zone: { id: 3039, name: 'Whitefish Range' } })
  })
})
