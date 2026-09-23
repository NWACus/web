import fixture from './fixtures/nwac-weather-forecasts.json'

const mockFetch = jest.fn()
jest.mock('../../src/services/nac/nac', () => ({
  fetchNwacWeatherForecasts: (...a: unknown[]) => mockFetch(...a),
}))

// Import after the mock is registered (jest hoists the mock above imports).
import { getNwacWeatherSource } from '@/services/nac/sources'
import { nwacWeatherForecastsResponseSchema } from '@/services/nac/types/nwacWeatherSchemas'

const wire = nwacWeatherForecastsResponseSchema.parse(fixture)

beforeEach(() => mockFetch.mockReset())

describe('getNwacWeatherSource', () => {
  it('passes the query through and maps the answer into a forecast day', async () => {
    mockFetch.mockResolvedValue(wire)
    const day = await getNwacWeatherSource().getForecastDay({ date: '2026-09-14', zone: 1645 })
    expect(mockFetch).toHaveBeenCalledWith({ date: '2026-09-14', zone: 1645 })
    expect(day?.issuances.map((i) => i.type)).toEqual(['afternoon', 'morning'])
  })

  it('answers null when the read fails or is rejected', async () => {
    mockFetch.mockResolvedValue(null)
    await expect(getNwacWeatherSource().getForecastDay()).resolves.toBeNull()
  })
})
