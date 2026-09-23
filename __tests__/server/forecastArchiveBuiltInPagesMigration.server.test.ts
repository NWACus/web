import { up } from '../../src/migrations/20260923_153949_forecast_archive_built_in_pages'

type Tenant = { id: number; slug: string }
type Doc = { url: string; tenant: number | { id: number } }

const WEATHER_ARCHIVE = '/forecasts/avalanche/archive/mountain-weather'

function capabilities(weatherCenters: string[]) {
  return {
    centers: ['NWAC', 'SAC', 'SNFAC', 'PAC'].map((id) => ({
      id,
      platforms: { forecasts: true, weather: weatherCenters.includes(id) },
    })),
  }
}

async function runUp(
  tenants: Tenant[],
  docs: Doc[],
  afp: { ok: true; body: unknown } | { ok: false } = { ok: true, body: capabilities([]) },
) {
  const fetchMock = jest
    .spyOn(global, 'fetch')
    .mockResolvedValue(afp.ok ? Response.json(afp.body) : new Response(null, { status: 500 }))
  const create = jest.fn().mockResolvedValue({})
  const payload = {
    find: jest.fn(({ collection }: { collection: string }) =>
      Promise.resolve({ docs: collection === 'tenants' ? tenants : docs }),
    ),
    create,
    logger: { info: jest.fn(), warn: jest.fn() },
  }
  // @ts-expect-error - partial migration args; up only touches payload.find/create/logger and req
  await up({ payload, req: {} })
  fetchMock.mockRestore()
  return create.mock.calls.map(([args]) => `${args.data.tenant} ${args.data.url}`).sort()
}

describe('forecast archive built-in pages migration', () => {
  it('adds the archive pages to each tenant with a forecast built-in page', async () => {
    const created = await runUp(
      [
        { id: 1, slug: 'nwac' },
        { id: 3, slug: 'sac' },
      ],
      [
        { url: '/forecasts/avalanche', tenant: 1 },
        { url: '/forecasts/avalanche/olympics', tenant: 1 },
        { url: '/forecasts/avalanche/central-sierra-nevada', tenant: { id: 3 } },
        { url: '/weather/stations/map', tenant: 1 },
      ],
    )

    expect(created).toEqual([
      '1 /forecasts/avalanche/archive',
      '1 /forecasts/avalanche/archive/danger-over-time',
      '3 /forecasts/avalanche/archive',
      '3 /forecasts/avalanche/archive/danger-over-time',
    ])
  })

  it('adds the weather archive only where the AFP reports a weather product', async () => {
    const created = await runUp(
      [
        { id: 1, slug: 'dvac' },
        { id: 2, slug: 'nwac' },
        { id: 4, slug: 'snfac' },
      ],
      [
        { url: '/forecasts/avalanche', tenant: 1 },
        // The May backfill gave /weather/forecast to non-weather centers too
        { url: '/weather/forecast', tenant: 1 },
        { url: '/forecasts/avalanche', tenant: 2 },
        { url: '/forecasts/avalanche', tenant: 4 },
      ],
      { ok: true, body: capabilities(['SNFAC']) },
    )

    expect(created.filter((c) => c.endsWith(WEATHER_ARCHIVE))).toEqual([`4 ${WEATHER_ARCHIVE}`])
  })

  it('still adds the other archive pages when the AFP call fails', async () => {
    const created = await runUp(
      [{ id: 4, slug: 'snfac' }],
      [{ url: '/forecasts/avalanche', tenant: 4 }],
      { ok: false },
    )

    expect(created).toEqual([
      '4 /forecasts/avalanche/archive',
      '4 /forecasts/avalanche/archive/danger-over-time',
    ])
  })

  it('skips pages a tenant already has, and tenants with no forecast page', async () => {
    const created = await runUp(
      [
        { id: 7, slug: 'msac' },
        { id: 9, slug: 'other' },
      ],
      [
        { url: '/forecasts/avalanche/mount-shasta', tenant: 7 },
        { url: '/forecasts/avalanche/archive', tenant: 7 },
        { url: '/weather/stations/map', tenant: 9 },
      ],
    )

    expect(created).toEqual(['7 /forecasts/avalanche/archive/danger-over-time'])
  })
})
