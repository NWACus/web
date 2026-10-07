import { NextRequest } from 'next/server'

const mockGetDates = jest.fn()
jest.mock('../../src/services/nac/sources', () => ({
  getNWACWeatherSource: () => ({ getDates: (...a: unknown[]) => mockGetDates(...a) }),
}))

// Avoid loading the real nac module (and payload) just for the timezone.
const mockGetAvalancheCenterMetadata = jest.fn()
jest.mock('../../src/services/nac/nac', () => ({
  getAvalancheCenterMetadata: (...a: unknown[]) => mockGetAvalancheCenterMetadata(...a),
}))

const mockGetNativeProductFlag = jest.fn()
jest.mock('../../src/utilities/getNativeProductFlag', () => ({
  getNativeProductFlag: (...a: unknown[]) => mockGetNativeProductFlag(...a),
}))

import { GET } from '@/app/api/[center]/nwac-weather-dates/route'

function ask(query: string, center = 'nwac') {
  const url = `http://localhost/api/${center}/nwac-weather-dates${query}`
  return GET(new NextRequest(url), { params: Promise.resolve({ center }) })
}

beforeEach(() => {
  jest.useFakeTimers({ now: new Date('2026-09-15T15:00:00Z') })
  mockGetDates.mockReset()
  mockGetNativeProductFlag.mockReset()
  mockGetNativeProductFlag.mockResolvedValue(true)
  mockGetAvalancheCenterMetadata.mockReset()
  mockGetAvalancheCenterMetadata.mockResolvedValue({ timezone: 'America/Los_Angeles' })
})

afterEach(() => {
  jest.useRealTimers()
})

describe('nwac-weather-dates route', () => {
  it('answers the published dates in the window, cacheably at the edge', async () => {
    mockGetDates.mockResolvedValue(['2026-07-30'])

    const res = await ask('?from=2026-07-01&to=2026-07-31')

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ dates: ['2026-07-30'] })
    expect(res.headers.get('Cache-Control')).toBe(
      'public, s-maxage=1800, stale-while-revalidate=86400',
    )
  })

  it('reads a window that is wholly past as historical', async () => {
    mockGetDates.mockResolvedValue([])

    await ask('?from=2026-07-01&to=2026-07-31')

    expect(mockGetDates).toHaveBeenCalledWith('2026-07-01', '2026-07-31', { historical: true })
  })

  it('reads the current month as live', async () => {
    mockGetDates.mockResolvedValue([])

    await ask('?from=2026-09-01&to=2026-09-30')

    expect(mockGetDates).toHaveBeenCalledWith('2026-09-01', '2026-09-30', { historical: false })
  })

  it('rejects a malformed or backwards window before going upstream', async () => {
    expect((await ask('?from=2026-07-01')).status).toBe(400)
    expect((await ask('?from=July&to=2026-07-31')).status).toBe(400)
    expect((await ask('?from=2026-08-01&to=2026-07-31')).status).toBe(400)
    expect(mockGetDates).not.toHaveBeenCalled()
  })

  it('404s without asking upstream when NWAC has native weather off', async () => {
    mockGetNativeProductFlag.mockResolvedValue(false)

    const res = await ask('?from=2026-07-01&to=2026-07-31')

    expect(res.status).toBe(404)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
    expect(mockGetNativeProductFlag).toHaveBeenCalledWith('nwac', 'weather')
    expect(mockGetDates).not.toHaveBeenCalled()
  })

  it('serves NWAC only', async () => {
    const res = await ask('?from=2026-07-01&to=2026-07-31', 'sac')

    expect(res.status).toBe(404)
    expect(mockGetDates).not.toHaveBeenCalled()
  })
})
