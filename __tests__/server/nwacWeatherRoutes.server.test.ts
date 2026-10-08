/**
 * The dated NWAC Mountain Weather route refuses another center, a date that is not a day, and
 * NWAC with its `weather` flag off, before rendering anything.
 */
// `notFound()` throws in Next; here it throws a recognisable error instead.
jest.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND')
  },
}))

// The page body is not under test, and it pulls in Payload.
jest.mock('../../src/components/NWACWeather/ForecastPage', () => ({ ForecastPage: () => null }))
jest.mock('../../src/components/Breadcrumbs/Breadcrumbs', () => ({ Breadcrumbs: () => null }))

import DatedPage from '@/app/(frontend)/[center]/weather/forecast/[date]/page'

const dated = (center: string, date: string) =>
  DatedPage({ params: Promise.resolve({ center, date }) })

describe('NWAC Mountain Weather dated route', () => {
  it('renders for NWAC on a real day', async () => {
    await expect(dated('nwac', '2026-09-30')).resolves.toBeTruthy()
  })

  it('is not found for another center, or for a date that is not a day', async () => {
    await expect(dated('snfac', '2026-09-30')).rejects.toThrow('NEXT_NOT_FOUND')
    await expect(dated('nwac', '2026-13-45')).rejects.toThrow('NEXT_NOT_FOUND')
    await expect(dated('nwac', 'yesterday')).rejects.toThrow('NEXT_NOT_FOUND')
  })
})
