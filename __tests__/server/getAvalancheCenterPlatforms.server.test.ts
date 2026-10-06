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
      nwac_weather: false,
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
      nwac_weather: false,
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
      nwac_weather: false,
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
      nwac_weather: false,
    })
  })
})

describe('services: getAvalancheCenterPlatforms from the NAC v3 feed', () => {
  // The v3 feed is the only source that carries nwac_weather. The source is chosen when
  // the module loads, so load a fresh copy with the env set.
  const nacCentersResponse = {
    centers: [
      {
        id: 'NWAC',
        display_id: 'NWAC',
        platforms: {
          warnings: true,
          forecasts: true,
          stations: true,
          obs: true,
          weather: false,
          nwac_weather: true,
        },
      },
    ],
  }

  async function loadWithSource(source: string) {
    const previous = process.env.NAC_CAPABILITIES_SOURCE
    process.env.NAC_CAPABILITIES_SOURCE = source
    try {
      let mod: typeof import('@/services/nac/nac') | undefined
      jest.isolateModules(() => {
        mod = require('../../src/services/nac/nac')
      })
      return mod!
    } finally {
      if (previous === undefined) delete process.env.NAC_CAPABILITIES_SOURCE
      else process.env.NAC_CAPABILITIES_SOURCE = previous
    }
  }

  it('reads nwac_weather when NAC_CAPABILITIES_SOURCE is nac', async () => {
    server.use(
      http.get('https://api.avalanche.org/v3/public/avalanche-centers', () =>
        HttpResponse.json(nacCentersResponse),
      ),
    )
    const { getAvalancheCenterPlatforms: fromNac } = await loadWithSource('nac')
    const result = await fromNac('nwac')
    expect(result.nwac_weather).toBe(true)
    expect(result.weather).toBe(false)
  })

  it('stays on the WordPress feed for any other value', async () => {
    const { getAvalancheCenterPlatforms: fromAfp } = await loadWithSource('wordpress')
    const result = await fromAfp('nwac')
    expect(result.nwac_weather).toBe(false)
  })
})
