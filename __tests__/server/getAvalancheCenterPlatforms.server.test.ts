import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

jest.mock('../../src/payload.config', () => ({}))

jest.mock('payload', () => ({
  getPayload: jest.fn(),
}))

import { afpApiHost, nacApiHost } from '@/services/nac/hosts'
import { getAvalancheCenterPlatforms } from '@/services/nac/nac'
import { setupMswLifecycle } from '../helpers/mswLifecycle'

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

// Minimal /v2/public/avalanche-center/:id response. NWAC has saved platforms; SAC has none.
function makeCenterResponse(id: string, modules?: Record<string, unknown>) {
  return {
    id,
    name: id,
    url: `/${id.toLowerCase()}`,
    city: 'X',
    state: 'XX',
    timezone: 'America/Los_Angeles',
    email: 'x@example.com',
    phone: null,
    center_point: null,
    created_at: '2026-01-01T00:00:00Z',
    wkb_geometry: null,
    config: {
      expires_time: null,
      published_time: null,
      blog: false,
      blog_title: '',
      weather_table: [],
      ...(modules ? { modules } : {}),
    },
    type: 'nonprofit',
    widget_config: {},
    zones: [],
    nws_zones: [],
    nws_offices: [],
    off_season: false,
  }
}

const nwacModules = {
  display_id: 'NWAC',
  platforms: { forecasts: true, weather: false, nwac_weather: true },
}

const server = setupServer(
  http.get(`${afpApiHost}/`, () => HttpResponse.json(afpCentersResponse)),
  http.get(`${nacApiHost}/v2/public/avalanche-center/NWAC`, () =>
    HttpResponse.json(makeCenterResponse('NWAC', nwacModules)),
  ),
  http.get(`${nacApiHost}/v2/public/avalanche-center/SAC`, () =>
    HttpResponse.json(makeCenterResponse('SAC')),
  ),
)

setupMswLifecycle(server)

describe('services: getAvalancheCenterPlatforms', () => {
  it('returns platforms for a matching center slug', async () => {
    const result = await getAvalancheCenterPlatforms('nwac')
    expect(result).toEqual({
      warnings: true,
      forecasts: true,
      stations: true,
      obs: true,
      weather: true,
      nwac_weather: true,
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
      nwac_weather: true,
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

  it('reads nwac_weather only for a literal true in config.modules.platforms', async () => {
    server.use(
      http.get(`${nacApiHost}/v2/public/avalanche-center/NWAC`, () =>
        HttpResponse.json(
          makeCenterResponse('NWAC', { display_id: 'NWAC', platforms: { nwac_weather: 1 } }),
        ),
      ),
    )
    const result = await getAvalancheCenterPlatforms('nwac')
    expect(result.nwac_weather).toBe(false)
  })

  it('reads nwac_weather false when the metadata call fails', async () => {
    server.use(
      http.get(`${nacApiHost}/v2/public/avalanche-center/NWAC`, () =>
        HttpResponse.json({ message: 'nope' }, { status: 500 }),
      ),
    )
    const result = await getAvalancheCenterPlatforms('nwac')
    expect(result.forecasts).toBe(true)
    expect(result.nwac_weather).toBe(false)
  })
})
