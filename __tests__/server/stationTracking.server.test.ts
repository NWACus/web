jest.mock('../../src/payload.config', () => ({}))

import { withCurrentObservations, withUntracked } from '@/services/snowobs/stationTracking'

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
