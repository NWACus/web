jest.mock('../../src/payload.config', () => ({}))

import { withCurrentVariables } from '@/services/snowobs/stationTracking'

const station = (stid: string, source = 'nwac') => ({
  stid,
  source,
  name: null,
  elevation: null,
  partner: null,
  variables: [],
})

describe('withCurrentVariables', () => {
  it('gives each tracked station the variables of its current observation', () => {
    const current = new Map([
      ['nwac:1', ['air_temp', 'precip_accum_one_hour']],
      ['snotel:1', ['snow_depth']],
    ])
    const [nwac, snotel, none] = withCurrentVariables(
      [station('1'), station('1', 'snotel'), station('2')],
      current,
    )
    expect(nwac.variables).toEqual(['air_temp', 'precip_accum_one_hour'])
    expect(snotel.variables).toEqual(['snow_depth'])
    expect(none.variables).toEqual([])
  })
})
