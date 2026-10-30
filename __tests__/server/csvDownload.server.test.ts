jest.mock('../../src/payload.config', () => ({}))
jest.mock('../../src/services/turnstile', () => ({ passesCaptcha: jest.fn(async () => true) }))

const fetchStationTimeseriesMock = jest.fn()
jest.mock('../../src/services/snowobs/snowobs', () => ({
  ...jest.requireActual('../../src/services/snowobs/snowobs'),
  fetchStationTimeseries: (...args: unknown[]) => fetchStationTimeseriesMock(...args),
}))

import { stationCsvDownload } from '@/services/snowobs/csvDownload'
import { SnowObsError } from '@/services/snowobs/snowobs'

const datalogger = { stid: '4', source: 'nwac' }
const empty = { UNITS: {}, VARIABLES: [], STATION: [] }

function download(): Promise<Response> {
  return stationCsvDownload(new Request('https://x/csv?station=nwac:4&year=2025&units=metric'), {
    center: 'nwac',
    dataloggers: [datalogger],
    filePrefix: 'alpental',
  })
}

beforeEach(() => fetchStationTimeseriesMock.mockReset())

describe('stationCsvDownload', () => {
  it("reads the logger's whole raw record in the chosen units", async () => {
    fetchStationTimeseriesMock.mockResolvedValue(empty)
    expect((await download()).status).toBe(200)
    expect(fetchStationTimeseriesMock).toHaveBeenCalledWith(
      'nwac',
      [datalogger],
      expect.objectContaining({ rawData: true, units: 'metric' }),
    )
  })

  it('falls back to rounded readings when SnowObs 500s the raw read', async () => {
    fetchStationTimeseriesMock
      .mockRejectedValueOnce(new SnowObsError('boom', null, { status: 500 }))
      .mockResolvedValueOnce(empty)
    expect((await download()).status).toBe(200)
    expect(fetchStationTimeseriesMock).toHaveBeenLastCalledWith(
      'nwac',
      [datalogger],
      expect.not.objectContaining({ rawData: true }),
    )
  })
})
