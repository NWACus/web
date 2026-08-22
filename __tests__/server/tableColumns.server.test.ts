import { flattenTableColumns } from '../../src/services/snowobs/tableColumns'

// Alpental as the legacy table reads it: temperature at all three elevations,
// humidity at two, wind only from the ridge. One row per reading, so the three
// temperature columns come from a single row rather than three.
const alpental = [
  {
    variable: 'air_temp',
    stations: [{ stid: '1' }, { stid: '2' }, { stid: '3' }],
  },
  { variable: 'relative_humidity', stations: [{ stid: '3' }, { stid: '1' }] },
  { variable: 'wind_speed', stations: [{ stid: '3' }] },
]

describe('flattenTableColumns', () => {
  it('reads each row left to right, then moves to the next', () => {
    expect(flattenTableColumns(alpental)).toEqual([
      { stid: '1', variable: 'air_temp' },
      { stid: '2', variable: 'air_temp' },
      { stid: '3', variable: 'air_temp' },
      { stid: '3', variable: 'relative_humidity' },
      { stid: '1', variable: 'relative_humidity' },
      { stid: '3', variable: 'wind_speed' },
    ])
  })

  it('honours row order rather than a site-wide variable order', () => {
    // Mt Washington puts wind direction before humidity, which is why the order
    // is stored per page instead of derived from a fixed sequence.
    const reordered = [alpental[2], alpental[1], alpental[0]]
    expect(flattenTableColumns(reordered).map((column) => column.variable)).toEqual([
      'wind_speed',
      'relative_humidity',
      'relative_humidity',
      'air_temp',
      'air_temp',
      'air_temp',
    ])
  })

  it('skips unpopulated stations rather than throwing', () => {
    // Costs the column, not the page: a group read at depth 0 still renders.
    const rows = [{ variable: 'air_temp', stations: [12, { stid: '3' }] }]
    expect(flattenTableColumns(rows)).toEqual([{ stid: '3', variable: 'air_temp' }])
  })

  it('is empty for a page with no columns yet', () => {
    expect(flattenTableColumns([])).toEqual([])
    expect(flattenTableColumns(null)).toEqual([])
    expect(flattenTableColumns([{ variable: null, stations: [{ stid: '3' }] }])).toEqual([])
  })
})
