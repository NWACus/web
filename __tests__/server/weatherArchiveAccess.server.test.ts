const mockGetPlatforms = jest.fn()
const mockGetFlag = jest.fn()
jest.mock('../../src/services/nac/nac', () => ({
  getAvalancheCenterPlatforms: (...a: unknown[]) => mockGetPlatforms(...a),
}))
jest.mock('../../src/utilities/getNativeProductFlag', () => ({
  getNativeProductFlag: (...a: unknown[]) => mockGetFlag(...a),
}))

// Import after the mocks are registered (jest hoists the mocks above imports).
import { getWeatherArchiveAccess } from '@/components/forecast/archive/weatherArchiveAccess'

function given(
  platforms: { forecasts: boolean; weather: boolean },
  flags: Record<string, boolean>,
) {
  mockGetPlatforms.mockResolvedValue(platforms)
  mockGetFlag.mockImplementation(async (_center: string, product: string) => flags[product])
}

beforeEach(() => {
  mockGetPlatforms.mockReset()
  mockGetFlag.mockReset()
})

describe('getWeatherArchiveAccess', () => {
  it('is native when the center publishes weather and both rollout flags are on', async () => {
    given({ forecasts: true, weather: true }, { forecast: true, weather: true })
    expect(await getWeatherArchiveAccess('snfac')).toEqual({
      useNativeForecast: true,
      available: true,
      native: true,
    })
  })

  it('offers no tab to a center without a NAC weather product, whatever the flags say', async () => {
    given({ forecasts: true, weather: false }, { forecast: true, weather: true })
    expect(await getWeatherArchiveAccess('nwac')).toEqual({
      useNativeForecast: true,
      available: false,
      native: false,
    })
  })

  it('falls back to the widget when either rollout flag is off', async () => {
    given({ forecasts: true, weather: true }, { forecast: true, weather: false })
    expect((await getWeatherArchiveAccess('sac')).native).toBe(false)

    given({ forecasts: true, weather: true }, { forecast: false, weather: true })
    expect((await getWeatherArchiveAccess('sac')).native).toBe(false)
  })
})
