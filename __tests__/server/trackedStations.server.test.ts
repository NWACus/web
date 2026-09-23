import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

import { setupMswLifecycle } from '../helpers/mswLifecycle'

jest.mock('../../src/payload.config', () => ({}))

const getMetadataMock = jest.fn()
jest.mock('../../src/services/nac/nac', () => ({
  getAvalancheCenterMetadata: () => getMetadataMock(),
}))

import { SnowObsError } from '@/services/snowobs/access'
import { findTrackedStation, unknownStationKeys } from '@/services/snowobs/trackedStations'

const TRACKING_URL = 'https://api.snowobs.com/wx/v1/station/tracking/'

// SnowObs sends SNOTEL stids as numbers; the list is otherwise as the admin picker reads it.
const TRACKED = [
  { stid: '57', source: 'nwac', name: 'White Chuck Mountain', elevation: 5030 },
  { stid: 502, source: 'snotel', name: 'Green Lake', elevation: 5920 },
  { stid: 'C6318', source: 'mesowest', name: 'CW6318 Welches', elevation: 1290.68 },
]

let trackingReads = 0

const server = setupServer(
  http.get(TRACKING_URL, () => {
    trackingReads += 1
    return HttpResponse.json(TRACKED)
  }),
)

setupMswLifecycle(server)

beforeEach(() => {
  trackingReads = 0
  getMetadataMock.mockResolvedValue({ widget_config: { stations: { token: 'afp-token' } } })
})

describe('findTrackedStation', () => {
  it('finds a station the center tracks, with its SnowObs metadata', async () => {
    const station = await findTrackedStation('nwac', { source: 'snotel', stid: '502' })
    expect(station).toMatchObject({ stid: '502', source: 'snotel', name: 'Green Lake' })
  })

  it('matches on source and stid together, since a stid is unique only within a source', async () => {
    expect(await findTrackedStation('nwac', { source: 'nwac', stid: '502' })).toBeNull()
  })

  it('is null for a stid our token could read but the center does not track', async () => {
    expect(await findTrackedStation('nwac', { source: 'mesowest', stid: 'KSEA' })).toBeNull()
  })

  it('is null when the center tracks nothing', async () => {
    server.use(http.get(TRACKING_URL, () => new HttpResponse(null, { status: 204 })))
    expect(await findTrackedStation('nwac', { source: 'nwac', stid: '57' })).toBeNull()
  })

  it('fails loudly, rather than 404ing every station, when SnowObs is down', async () => {
    server.use(http.get(TRACKING_URL, () => new HttpResponse(null, { status: 503 })))
    await expect(findTrackedStation('nwac', { source: 'nwac', stid: '57' })).rejects.toThrow(
      SnowObsError,
    )
  })
})

describe('unknownStationKeys', () => {
  it('passes stations on a station page without reading tracking', async () => {
    const onPages = new Set(['nwac:1', 'nwac:2'])
    expect(await unknownStationKeys('nwac', ['nwac:1', 'nwac:2'], onPages)).toEqual([])
    expect(trackingReads).toBe(0)
  })

  it('passes a tracked station no page lists', async () => {
    expect(await unknownStationKeys('nwac', ['nwac:1', 'snotel:502'], new Set(['nwac:1']))).toEqual(
      [],
    )
    expect(trackingReads).toBe(1)
  })

  it('names every key that is neither on a page nor tracked', async () => {
    const unknown = await unknownStationKeys(
      'nwac',
      ['mesowest:C6318', 'mesowest:KSEA', 'nwac:502'],
      new Set(),
    )
    expect(unknown).toEqual(['mesowest:KSEA', 'nwac:502'])
  })

  it('checks everything against tracking when no page allowlist is given', async () => {
    expect(await unknownStationKeys('nwac', ['nwac:57', 'nwac:1'])).toEqual(['nwac:1'])
  })
})
