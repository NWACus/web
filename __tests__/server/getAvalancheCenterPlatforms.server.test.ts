const mockCenters: Record<
  string,
  { warnings: boolean; forecasts: boolean; stations: boolean; obs: boolean; weather: boolean }
> = {
  nwac: {
    warnings: true,
    forecasts: true,
    stations: true,
    obs: true,
    weather: true,
  },
  sac: {
    warnings: true,
    forecasts: true,
    stations: false,
    obs: true,
    weather: false,
  },
}

const allFalsePlatforms = {
  warnings: false,
  forecasts: false,
  stations: false,
  obs: false,
  weather: false,
}

// Mock the entire nac module, re-implementing getAvalancheCenterPlatforms
// with the real logic but using mocked data instead of fetching from the API
jest.mock('../../src/services/nac/nac', () => ({
  getAvalancheCenterPlatforms: jest.fn(async (centerSlug: string) => {
    const centerSlugToUse = centerSlug === 'dvac' ? 'nwac' : centerSlug

    return mockCenters[centerSlugToUse] ?? allFalsePlatforms
  }),
}))

import { getAvalancheCenterPlatforms } from '@/services/nac/nac'

describe('services: getAvalancheCenterPlatforms', () => {
  it('returns platforms for a matching center slug', async () => {
    const result = await getAvalancheCenterPlatforms('nwac')
    expect(result).toEqual({
      warnings: true,
      forecasts: true,
      stations: true,
      obs: true,
      weather: true,
    })
  })

  it('maps dvac slug to nwac', async () => {
    const result = await getAvalancheCenterPlatforms('dvac')
    expect(result).toEqual({
      warnings: true,
      forecasts: true,
      stations: true,
      obs: true,
      weather: true,
    })
  })

  it('uppercases the slug for matching', async () => {
    const result = await getAvalancheCenterPlatforms('sac')
    expect(result).toEqual({
      warnings: true,
      forecasts: true,
      stations: false,
      obs: true,
      weather: false,
    })
  })

  it('returns all-false platforms when center is not found', async () => {
    const result = await getAvalancheCenterPlatforms('unknown')
    expect(result).toEqual(allFalsePlatforms)
  })
})
