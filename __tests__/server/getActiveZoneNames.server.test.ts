import { getActiveZoneNames } from '@/blocks/ObservationsWidget/getActiveZoneNames'

const mockForecastZones = jest.fn()
const mockObsZones = jest.fn()

jest.mock('../../src/services/nac/nac', () => ({
  getAvalancheCenterMetadata: async () => ({ zones: mockForecastZones() }),
  getCombinedObsZones: async () => mockObsZones(),
}))

const forecastZone = (name: string, rank: number | null, status = 'active') => ({
  name,
  rank,
  status,
})

const obsZone = (name: string, priority: number, status = 'active') => ({
  zone_id: name,
  name,
  status,
  zone_type: priority === 1 ? 'forecast_zone' : 'obs_zone',
  priority,
})

describe('getActiveZoneNames', () => {
  beforeEach(() => {
    mockForecastZones.mockReturnValue([forecastZone('Forecast Only', 1)])
  })

  it("lists the obs API's zones in the widget's order: forecast zones first, then by name", async () => {
    mockObsZones.mockReturnValue([
      obsZone('Boise Mountains', 2),
      obsZone('Galena Summit', 1),
      obsZone('Retired', 1, 'disabled'),
      obsZone('Banner Summit', 1),
    ])

    expect(await getActiveZoneNames('snfac')).toEqual([
      'Banner Summit',
      'Galena Summit',
      'Boise Mountains',
    ])
  })

  it.each([
    ['has no obs zones', () => mockObsZones.mockReturnValue([])],
    [
      'fails',
      () =>
        mockObsZones.mockImplementation(() => {
          throw new Error('401')
        }),
    ],
  ])('falls back to forecast zones when the obs API %s', async (_case, arrange) => {
    arrange()

    expect(await getActiveZoneNames('nwac')).toEqual(['Forecast Only'])
  })

  it('lists forecast zones by rank with unranked zones last', async () => {
    mockObsZones.mockReturnValue([])
    mockForecastZones.mockReturnValue([
      forecastZone('Unranked B', null),
      forecastZone('Second', 2),
      forecastZone('Retired', 0, 'disabled'),
      forecastZone('Unranked A', null),
      forecastZone('First', 1),
    ])

    const names = await getActiveZoneNames('nwac')

    expect(names.slice(0, 2)).toEqual(['First', 'Second'])
    expect(names.slice(2).sort()).toEqual(['Unranked A', 'Unranked B'])
  })

  it('returns nothing for an unknown center', async () => {
    expect(await getActiveZoneNames('not-a-center')).toEqual([])
  })
})
