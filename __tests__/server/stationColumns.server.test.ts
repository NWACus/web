import {
  mergeOrder,
  orderToSave,
  pruneColumnOrder,
  readingLabel,
  readingsSummary,
  selectColumns,
  showsReading,
  toColumnOrder,
  validateColumnOrder,
  withShownReadings,
} from '@/services/stations/stationColumns'

describe('toColumnOrder', () => {
  it('keeps well-formed station readings, in order', () => {
    expect(
      toColumnOrder([
        { stid: '2', source: 'nwac', variable: 'snow_depth' },
        { stid: '1', source: 'nwac' },
        null,
        { stid: '1', source: 'nwac', variable: 'air_temp', extra: true },
      ]),
    ).toEqual([
      { stid: '2', source: 'nwac', variable: 'snow_depth' },
      { stid: '1', source: 'nwac', variable: 'air_temp' },
    ])
    expect(toColumnOrder(undefined)).toEqual([])
  })
})

describe('readingLabel', () => {
  it("uses the table's short label, or the variable when there is none", () => {
    expect(readingLabel('air_temp')).toBe('Temp')
    expect(readingLabel('new_sensor')).toBe('new_sensor')
  })
})

const col = (stid: string, variable: string) => ({ station: { stid, source: 'nwac' }, variable })
const entry = (stid: string, variable: string) => ({ stid, source: 'nwac', variable })
const station = (stid: string, columns?: string[], hidden?: string[]) => ({
  stid,
  source: 'nwac',
  ...(columns && { columns }),
  ...(hidden && { hidden }),
})

describe('orderToSave', () => {
  const defaults = [col('1', 'air_temp'), col('2', 'air_temp'), col('1', 'snow_depth')]
  const stations = [station('1'), station('2')]

  it('stores nothing for the default arrangement', () => {
    expect(orderToSave([...defaults], defaults, [], stations)).toEqual([])
  })

  it('stores every column for any other arrangement', () => {
    expect(orderToSave([defaults[2], defaults[0], defaults[1]], defaults, [], stations)).toEqual([
      { stid: '1', source: 'nwac', variable: 'snow_depth' },
      { stid: '1', source: 'nwac', variable: 'air_temp' },
      { stid: '2', source: 'nwac', variable: 'air_temp' },
    ])
  })
})

describe('mergeOrder', () => {
  // Stations 1 and 2 are shown swapped; station 3 has a stored column the admin can't show.
  const mergeShown = (stored: ReturnType<typeof entry>[]) =>
    mergeOrder(
      stored,
      [col('2', 'air_temp'), col('1', 'air_temp')],
      [station('1'), station('2'), station('3')],
    )

  it("keeps a column the admin can't show after the entry it followed", () => {
    const stored = [entry('3', 'snow_depth'), entry('1', 'air_temp'), entry('2', 'air_temp')]
    expect(mergeShown(stored)).toEqual([
      entry('3', 'snow_depth'),
      entry('2', 'air_temp'),
      entry('1', 'air_temp'),
    ])
  })

  it('places an unseen column after the nearest shown entry before it', () => {
    const stored = [entry('1', 'air_temp'), entry('3', 'snow_depth'), entry('2', 'air_temp')]
    expect(mergeShown(stored)).toEqual([
      entry('2', 'air_temp'),
      entry('1', 'air_temp'),
      entry('3', 'snow_depth'),
    ])
  })

  it('drops entries for a removed station or an unticked reading', () => {
    const stored = [entry('9', 'air_temp'), entry('1', 'wind_speed'), entry('1', 'air_temp')]
    expect(mergeOrder(stored, [col('1', 'air_temp')], [station('1', ['air_temp'])])).toEqual([
      entry('1', 'air_temp'),
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
        [station('1'), station('2', ['air_temp'])],
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

describe('orderToSave with columns the admin cannot show', () => {
  it('keeps a custom order when only the shown columns are back in default order', () => {
    const defaults = [col('1', 'air_temp'), col('2', 'air_temp')]
    expect(
      orderToSave(
        defaults,
        defaults,
        [entry('3', 'snow_depth'), ...defaults.map((c) => entry(c.station.stid, c.variable))],
        [station('1'), station('2'), station('3')],
      ),
    ).toEqual([entry('3', 'snow_depth'), entry('1', 'air_temp'), entry('2', 'air_temp')])
  })
})

describe('hidden readings', () => {
  const hiding = station('1', undefined, ['wind_gust'])

  it('shows every reading but the hidden ones, new ones included', () => {
    expect(showsReading(hiding, 'wind_speed')).toBe(true)
    expect(showsReading(hiding, 'brand_new_sensor')).toBe(true)
    expect(showsReading(hiding, 'wind_gust')).toBe(false)
  })

  it('is ignored once a station lists its readings', () => {
    expect(showsReading(station('1', ['air_temp'], ['air_temp']), 'air_temp')).toBe(true)
  })

  it('drops hidden columns from the table and the stored order', () => {
    expect(selectColumns([col('1', 'wind_speed'), col('1', 'wind_gust')], [hiding])).toEqual([
      col('1', 'wind_speed'),
    ])
    expect(pruneColumnOrder([entry('1', 'wind_gust'), entry('1', 'air_temp')], [hiding])).toEqual([
      entry('1', 'air_temp'),
    ])
  })
})

describe('withShownReadings', () => {
  const choices = ['air_temp', 'wind_speed', 'wind_gust']

  it('stores what is hidden while new readings show', () => {
    expect(
      withShownReadings(station('1'), choices, new Set(['air_temp', 'wind_speed']), true),
    ).toEqual({ stid: '1', source: 'nwac', hidden: ['wind_gust'] })
    expect(
      withShownReadings(station('1', undefined, ['wind_gust']), choices, new Set(choices), true),
    ).toEqual({ stid: '1', source: 'nwac' })
  })

  it('stores the shown list when new readings stay hidden', () => {
    expect(withShownReadings(station('1'), choices, new Set(['air_temp']), false)).toEqual({
      stid: '1',
      source: 'nwac',
      columns: ['air_temp'],
    })
  })
})

describe('readingsSummary', () => {
  const choices = ['air_temp', 'wind_speed', 'wind_gust']

  it('sums up a station on all its readings, with or without hidden ones', () => {
    expect(readingsSummary(station('1'), choices)).toEqual({
      all: true,
      labels: ['All readings · 3'],
    })
    expect(readingsSummary(station('1', undefined, ['wind_gust']), choices)).toEqual({
      all: true,
      labels: ['All except Gust'],
    })
  })

  it('lists the readings of a station that chose them, or None', () => {
    expect(readingsSummary(station('1', ['wind_speed', 'air_temp']), choices)).toEqual({
      all: false,
      labels: ['Temp', 'Spd'],
    })
    expect(readingsSummary(station('1', []), choices)).toEqual({ all: false, labels: ['None'] })
  })
})
