import {
  mergeOrder,
  orderToSave,
  pruneColumnOrder,
  readingLabel,
  toColumnOrder,
  validateColumnOrder,
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
const station = (stid: string, columns?: string[]) => ({
  stid,
  source: 'nwac',
  ...(columns && { columns }),
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
