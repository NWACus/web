import { getActiveZoneNames } from '@/blocks/ObservationsWidget/getActiveZoneNames'

const mockZones = jest.fn()

jest.mock('../../src/services/nac/nac', () => ({
  getAvalancheCenterMetadata: async () => ({ zones: mockZones() }),
}))

const zone = (name: string, rank: number | null, status = 'active') => ({ name, rank, status })

describe('getActiveZoneNames', () => {
  it('lists active zones by rank with unranked zones last', async () => {
    mockZones.mockReturnValue([
      zone('Unranked B', null),
      zone('Second', 2),
      zone('Retired', 0, 'disabled'),
      zone('Unranked A', null),
      zone('First', 1),
    ])

    const names = await getActiveZoneNames('nwac')

    expect(names.slice(0, 2)).toEqual(['First', 'Second'])
    expect(names.slice(2).sort()).toEqual(['Unranked A', 'Unranked B'])
  })

  it('returns nothing for an unknown center', async () => {
    expect(await getActiveZoneNames('not-a-center')).toEqual([])
  })
})
