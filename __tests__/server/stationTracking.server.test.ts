import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

jest.mock('../../src/payload.config', () => ({}))

import {
  fetchCatalogue,
  fetchCurrentObservations,
  fetchTrackedStations,
  withCurrentObservations,
  withUntracked,
} from '@/services/snowobs/stationTracking'

const origins: Record<string, string | null> = {}
const server = setupServer(
  http.get('https://api.snowobs.com/wx/v1/*', ({ request }) => {
    origins[new URL(request.url).pathname] = request.headers.get('origin')
    return HttpResponse.json(request.url.includes('/current/') ? { STATION: [] } : [])
  }),
)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())

const station = (stid: string, source = 'nwac') => ({
  stid,
  source,
  name: null,
  elevation: null,
  partner: null,
  variables: [],
  observedAt: null,
  tracked: true,
})

describe('withCurrentObservations', () => {
  it('gives each tracked station what its current observation reports, and when', () => {
    const current = new Map([
      [
        'nwac:1',
        { variables: ['air_temp', 'precip_accum_one_hour'], observedAt: '2026-09-18T19:00:00Z' },
      ],
      ['snotel:1', { variables: ['snow_depth'], observedAt: '2026-09-18T18:00:00Z' }],
    ])
    const [nwac, snotel, none] = withCurrentObservations(
      [station('1'), station('1', 'snotel'), station('2')],
      current,
    )
    expect(nwac.variables).toEqual(['air_temp', 'precip_accum_one_hour'])
    expect(nwac.observedAt).toBe('2026-09-18T19:00:00Z')
    expect(snotel.variables).toEqual(['snow_depth'])
    expect(none).toMatchObject({ variables: [], observedAt: null })
  })
})

describe('withUntracked', () => {
  it('appends catalogue stations the tracking list lacks, marked untracked', () => {
    const catalogue = [
      { ...station('1'), tracked: false },
      { ...station('40'), name: 'Coldwater', tracked: false },
    ]
    const merged = withUntracked([station('1')], catalogue)
    expect(merged.map((s) => [s.stid, s.tracked])).toEqual([
      ['1', true],
      ['40', false],
    ])
  })
})

describe('client feeds', () => {
  it('send an Origin on every request, so none caches a CORS-less response for the widget', async () => {
    await fetchTrackedStations('t')
    await fetchCatalogue('t', 'nwac')
    await fetchCurrentObservations('t')
    expect(origins).toEqual({
      '/wx/v1/station/tracking/': 'https://avy-fx.org',
      '/wx/v1/station/metadata/': 'https://avy-fx.org',
      '/wx/v1/station/data/current/': 'https://avy-fx.org',
    })
  })
})
