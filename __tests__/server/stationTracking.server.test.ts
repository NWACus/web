jest.mock('../../src/payload.config', () => ({}))

import { withCurrentObservations } from '@/services/snowobs/stationTracking'

const station = (stid: string, source = 'nwac') => ({
  stid,
  source,
  name: null,
  elevation: null,
  partner: null,
  variables: [],
  observedAt: null,
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
