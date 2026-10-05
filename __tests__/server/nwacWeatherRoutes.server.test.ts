/**
 * The two NWAC Mountain Weather routes refuse the page when the `nwacWeather` rollout flag is off,
 * and the dated one when the center or date is wrong, before rendering anything.
 */
const mockGetNativeProductFlag = jest.fn()
jest.mock('../../src/utilities/getNativeProductFlag', () => ({
  getNativeProductFlag: (...a: unknown[]) => mockGetNativeProductFlag(...a),
}))

// `notFound()` throws in Next; here it throws a recognisable error instead.
jest.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND')
  },
}))

// Neither page body is under test, and both pull in Payload.
jest.mock('../../src/components/NWACWeather/ForecastPage', () => ({ ForecastPage: () => null }))
jest.mock('../../src/components/forecast/NativeWeatherPage', () => ({
  NativeWeatherPage: () => null,
}))
jest.mock('../../src/components/Breadcrumbs/Breadcrumbs', () => ({ Breadcrumbs: () => null }))
jest.mock('../../src/components/NACWidget', () => ({ NACWidget: () => null }))
jest.mock('../../src/components/NACWidget/WidgetRouterHandler.client', () => ({
  WidgetRouterHandler: () => null,
}))
jest.mock('../../src/utilities/centerRoutePage', () => ({
  assertCenterPlatform: jest.fn(),
  centerRouteMetadata: jest.fn(),
  centerStaticParams: jest.fn(),
}))

import DatedPage from '@/app/(frontend)/[center]/weather/forecast/[date]/page'
import TodayPage from '@/app/(frontend)/[center]/weather/forecast/page'

const today = (center: string) => TodayPage({ params: Promise.resolve({ center }) })
const dated = (center: string, date: string) =>
  DatedPage({ params: Promise.resolve({ center, date }) })

beforeEach(() => {
  mockGetNativeProductFlag.mockReset()
})

describe('NWAC Mountain Weather routes', () => {
  it('render for NWAC when the nwacWeather flag is on', async () => {
    mockGetNativeProductFlag.mockResolvedValue(true)

    await expect(today('nwac')).resolves.toBeTruthy()
    await expect(dated('nwac', '2026-09-30')).resolves.toBeTruthy()
    expect(mockGetNativeProductFlag).toHaveBeenCalledWith('nwac', 'nwacWeather')
  })

  it('are not found for NWAC while the flag is off', async () => {
    mockGetNativeProductFlag.mockResolvedValue(false)

    await expect(today('nwac')).rejects.toThrow('NEXT_NOT_FOUND')
    await expect(dated('nwac', '2026-09-30')).rejects.toThrow('NEXT_NOT_FOUND')
  })

  it('has no dated page for another center, or for a date that is not a day', async () => {
    mockGetNativeProductFlag.mockResolvedValue(true)

    await expect(dated('snfac', '2026-09-30')).rejects.toThrow('NEXT_NOT_FOUND')
    await expect(dated('nwac', '2026-13-45')).rejects.toThrow('NEXT_NOT_FOUND')
    await expect(dated('nwac', 'yesterday')).rejects.toThrow('NEXT_NOT_FOUND')
    expect(mockGetNativeProductFlag).not.toHaveBeenCalled()
  })
})
