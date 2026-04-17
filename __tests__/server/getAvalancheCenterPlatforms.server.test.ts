import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

jest.mock('../../src/payload.config', () => ({}))

jest.mock('payload', () => ({
  getPayload: jest.fn(),
}))

import { getAvalancheCenterPlatforms } from '@/services/nac/nac'

const afpCentersResponse = {
  centers: [
    {
      id: 'NWAC',
      display_id: 'NWAC',
      platforms: {
        warnings: true,
        forecasts: true,
        stations: true,
        obs: true,
        weather: true,
      },
    },
    {
      id: 'SAC',
      display_id: 'SAC',
      platforms: {
        warnings: true,
        forecasts: true,
        stations: false,
        obs: true,
        weather: false,
      },
    },
  ],
}

const server = setupServer(
  http.get('https://forecasts.avalanche.org/', () => HttpResponse.json(afpCentersResponse)),
)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

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
    expect(result).toEqual({
      warnings: false,
      forecasts: false,
      stations: false,
      obs: false,
      weather: false,
    })
  })
})
