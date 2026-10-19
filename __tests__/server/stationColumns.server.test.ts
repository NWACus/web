import {
  orderToSave,
  pruneColumnOrder,
  readingLabel,
  readingsSummary,
  selectColumns,
  showsReading,
  toColumnOrder,
  validateColumnOrder,
  withHiddenReadings,
} from '@/services/stations/stationColumns'

const col = (stid: string, variable: string) => ({ station: { stid, source: 'nwac' }, variable })
const entry = (stid: string, variable: string) => ({ stid, source: 'nwac', variable })
const station = (stid: string, hidden?: string[]) => ({
  stid,
  source: 'nwac',
  ...(hidden && { hidden }),
})

describe('toColumnOrder', () => {
  it('keeps well-formed station readings, in order', () => {
    expect(
      toColumnOrder([
        entry('2', 'snow_depth'),
        { stid: '1', source: 'nwac' },
        null,
        { ...entry('1', 'air_temp'), extra: true },
      ]),
    ).toEqual([entry('2', 'snow_depth'), entry('1', 'air_temp')])
    expect(toColumnOrder(undefined)).toEqual([])
  })
})

describe('readingLabel', () => {
  it("uses the table's short label, or the variable when there is none", () => {
    expect(readingLabel('air_temp')).toBe('Temp')
    expect(readingLabel('new_sensor')).toBe('new_sensor')
  })
})

describe('hidden readings', () => {
  const hiding = station('1', ['wind_gust'])

  it('shows every reading but the hidden ones, new ones included', () => {
    expect(showsReading(hiding, 'wind_speed')).toBe(true)
    expect(showsReading(hiding, 'brand_new_sensor')).toBe(true)
    expect(showsReading(hiding, 'wind_gust')).toBe(false)
  })

  it('drops hidden columns from the table and the stored order', () => {
    expect(selectColumns([col('1', 'wind_speed'), col('1', 'wind_gust')], [hiding])).toEqual([
      col('1', 'wind_speed'),
    ])
    expect(pruneColumnOrder([entry('1', 'wind_gust'), entry('1', 'air_temp')], [hiding])).toEqual([
      entry('1', 'air_temp'),
    ])
  })

  it('stores nothing extra when no reading is hidden', () => {
    expect(withHiddenReadings(hiding, [])).toEqual(station('1'))
    expect(withHiddenReadings(station('1'), ['air_temp'])).toEqual(station('1', ['air_temp']))
  })
})

describe('readingsSummary', () => {
  const choices = ['air_temp', 'wind_speed', 'wind_gust']

  it('sums up what a station shows', () => {
    expect(readingsSummary(station('1'), choices)).toBe('All readings · 3')
    expect(readingsSummary(station('1'), [])).toBe('All readings')
    expect(readingsSummary(station('1', ['wind_gust']), choices)).toBe('All except Gust')
    expect(readingsSummary(station('1', choices), choices)).toBe('None')
  })
})

describe('orderToSave', () => {
  const defaults = [col('1', 'air_temp'), col('2', 'air_temp'), col('1', 'snow_depth')]

  it('stores nothing for the default arrangement', () => {
    expect(orderToSave([...defaults], defaults)).toEqual([])
  })

  it('stores every column for any other arrangement', () => {
    expect(orderToSave([defaults[2], defaults[0], defaults[1]], defaults)).toEqual([
      entry('1', 'snow_depth'),
      entry('1', 'air_temp'),
      entry('2', 'air_temp'),
    ])
  })
})

describe('pruneColumnOrder', () => {
  it('keeps entries for stations on the page and readings they still show', () => {
    expect(
      pruneColumnOrder(
        [
          entry('1', 'air_temp'),
          entry('2', 'snow_depth'),
          entry('2', 'air_temp'),
          entry('3', 'air_temp'),
        ],
        [station('1'), station('2', ['snow_depth'])],
      ),
    ).toEqual([entry('1', 'air_temp'), entry('2', 'air_temp')])
  })
})

describe('validateColumnOrder', () => {
  it('accepts well-formed entries and nothing', () => {
    expect(validateColumnOrder([entry('1', 'air_temp')])).toBe(true)
    expect(validateColumnOrder(undefined)).toBe(true)
  })

  it('rejects a malformed entry or the same column twice', () => {
    expect(validateColumnOrder('air_temp')).toMatch(/needs a SnowObs id, source and reading/)
    expect(validateColumnOrder([{ stid: '1', source: 'nwac' }])).toMatch(/needs a SnowObs id/)
    expect(validateColumnOrder([entry('1', 'air_temp'), entry('1', 'air_temp')])).toMatch(
      /listed twice/,
    )
  })
})
