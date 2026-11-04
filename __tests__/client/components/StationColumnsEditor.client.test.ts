import { readingChoices, withoutReading } from '@/fields/stations/StationColumnsEditor'

jest.mock('@payloadcms/ui', () => ({ Button: () => null }))

describe('a hidden compass on a station no longer reporting wind direction', () => {
  const entry = { stid: '1', source: 'nwac', hidden: ['wind_direction_compass'] }

  it('stays a choice, after wind direction', () => {
    expect(readingChoices(entry, ['air_temp'])).toEqual(
      expect.arrayContaining(['wind_direction', 'wind_direction_compass']),
    )
  })

  it('survives hiding another reading', () => {
    expect(withoutReading(entry, ['air_temp'], 'air_temp').hidden).toEqual(
      expect.arrayContaining(['air_temp', 'wind_direction_compass']),
    )
  })
})
