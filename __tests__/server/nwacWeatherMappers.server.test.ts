import {
  blockDate,
  deriveSnow,
  deriveSnowLevel,
  fmtCalendarDate,
  fmtSnowAmount,
  fmtWind,
  periodDateGroups,
  precipPeriods,
  sectionFor,
  snowLevelBlocks,
  snowLevelTones,
  tempPeriods,
  windBearing,
  windBlocks,
} from '@/services/nac/nwacWeatherFormat'
import {
  mapV3NWACWeatherForecastDay,
  mapV3NWACWeatherIssuance,
} from '@/services/nac/sources/v3/nwacWeatherMappers'
import {
  nwacWeatherForecastResponseSchema,
  nwacWeatherForecastSchema,
  nwacWeatherForecastsResponseSchema,
} from '@/services/nac/types/nwacWeatherSchemas'
import fixture from './fixtures/nwac-weather-forecasts.json'
import exampleAfternoon from './fixtures/nwac-weather-formats/dashboard-v2-2026-09-01.afternoon.public.json'
import exampleMorning from './fixtures/nwac-weather-formats/dashboard-v2-2026-09-01.morning.public.json'

const day = mapV3NWACWeatherForecastDay(nwacWeatherForecastsResponseSchema.parse(fixture))
if (!day) throw new Error('fixture should map to a forecast day')
const afternoon = day.issuances[0]
const morning = day.issuances[1]

describe('mapV3NWACWeatherForecastDay', () => {
  it('keeps both issuances of the date, newest first', () => {
    expect(day.serviceDate).toBe('2026-09-14')
    expect(day.issuances.map((i) => i.type)).toEqual(['afternoon', 'morning'])
    expect(afternoon.author).toBe('Forecaster')
  })

  it('re-keys the flat rows into zone/point grids', () => {
    expect(afternoon.temp.olympics.n1).toEqual({ high: 53, low: 47 })
    expect(afternoon.wind.olympics.ev1).toEqual({ dir: 'W', speed: 15 })
    expect(afternoon.precip.HUR53.n1).toEqual({ qpf: 0.24, density: 11 })
    expect(afternoon.sensible.olympics.morning).toMatch(/cloudy/i)
  })

  it('splits the extended outlook levels off the main snow-level grid by block key', () => {
    const extendedKeys = afternoon.extendedBlocks.map((b) => b.key)
    expect(extendedKeys).toEqual(['nt3', 'am4', 'nt4', 'day5'])
    for (const zone of Object.keys(afternoon.extendedSnowLevel)) {
      expect(
        Object.keys(afternoon.extendedSnowLevel[zone]).every((k) => extendedKeys.includes(k)),
      ).toBe(true)
      expect(
        Object.keys(afternoon.snowLevel[zone] ?? {}).some((k) => extendedKeys.includes(k)),
      ).toBe(false)
    }
    expect(morning.extendedBlocks).toEqual([])
    expect(Object.keys(morning.extendedSnowLevel)).toEqual([])
  })

  it('carries the resolved calendar date on each period', () => {
    expect(afternoon.periods[0]).toMatchObject({ key: 'n1', kind: 'night', date: '2026-09-14' })
    // The recorded center ran its morning issuance over three periods.
    expect(morning.periods.map((p) => p.key)).toEqual(['d1', 'n1', 'd2'])
  })

  it('carries the format, its sections and the rows and slots it was published with', () => {
    expect(afternoon.format).toBe('dashboard-v2-2026-09-01')
    expect(afternoon.sections.map((s) => s.grid)).toEqual([
      'sensible',
      'precip',
      'snowLevel',
      'temp',
      'wind',
      'extendedSnowLevel',
    ])
    expect(afternoon.axes.windBlocks).toEqual(['ev1', 'nt1', 'am2', 'pm2'])
    expect(afternoon.extendedZones).toEqual(['olympics', 'west-north', 'stevens'])
    expect(afternoon.sensibleSlots).toEqual([
      { key: 'morning', label: 'Tonight', date: '2026-09-14' },
      { key: 'afternoon', label: 'Tomorrow', date: '2026-09-15' },
    ])
    expect(morning.sensibleSlots.map((s) => s.label)).toEqual(['Today', 'Tonight'])
  })

  it('returns null for the empty answer', () => {
    expect(
      mapV3NWACWeatherForecastDay({ available: false, serviceDate: null, forecasts: [] }),
    ).toBeNull()
    expect(nwacWeatherForecastResponseSchema.parse({ available: false })).toEqual({
      available: false,
    })
  })

  it('maps a single issuance the same way', () => {
    const one = mapV3NWACWeatherIssuance(nwacWeatherForecastSchema.parse(fixture.forecasts[0]))
    expect(one).toEqual(afternoon)
  })
})

describe('nwacWeatherFormat', () => {
  it('derives snow from QPF and density, snow level from freezing minus drop', () => {
    expect(deriveSnow(0.3, 10)).toBe(3)
    expect(deriveSnow(0.24, 11)).toBe(2.2)
    expect(deriveSnow(null, 10)).toBeNull()
    expect(deriveSnow(0.3, 0)).toBeNull()
    expect(deriveSnowLevel(5000, 1000)).toBe(4000)
    expect(deriveSnowLevel(5000, null)).toBe(4000)
    expect(deriveSnowLevel(500, 1000)).toBe(0)
  })

  it('prints values the way the dashboard preview does', () => {
    expect(fmtSnowAmount(3.4)).toBe('3"')
    expect(fmtSnowAmount(0.2)).toBe('0')
    expect(fmtSnowAmount(null)).toBe('—')
    expect(fmtWind({ dir: 'SW', speed: 25 })).toBe('SW 25')
    expect(fmtWind({ dir: null, speed: 0 })).toBe('Calm')
    expect(fmtWind(undefined)).toBe('—')
    expect(fmtCalendarDate('2026-09-14')).toBe('Mon Sep 14')
  })

  it('reads a compass point as the bearing the wind blows from', () => {
    expect(windBearing('N')).toBe(0)
    expect(windBearing('sw')).toBe(225)
    expect(windBearing('NNW')).toBe(337.5)
    expect(windBearing('VAR')).toBeNull()
    expect(windBearing(null)).toBeNull()
  })

  it('shades snow levels relative to the rest of the row', () => {
    expect(snowLevelTones([8500, 9000, 10000, null])).toEqual([0, 1, 3, null])
    expect(snowLevelTones([4000, 4000])).toEqual([0, 0])
    expect(snowLevelTones([null])).toEqual([null])
  })

  it('takes each table’s columns from the forecast’s axes, not from which cells are full', () => {
    expect(windBlocks(afternoon).map((b) => b.key)).toEqual(['ev1', 'nt1', 'am2', 'pm2'])
    expect(tempPeriods(afternoon).map((p) => p.key)).toEqual(['n1', 'd2'])
    expect(snowLevelBlocks(morning).length).toBe(6)
    // An empty grid keeps its columns; a full one gains none.
    expect(windBlocks({ ...afternoon, wind: {} }).length).toBe(4)
    const narrowed = { ...afternoon, axes: { ...afternoon.axes, windBlocks: ['ev1', 'nope'] } }
    expect(windBlocks(narrowed).map((b) => b.key)).toEqual(['ev1'])
  })

  it('reads a dry period as 0 snow without a density', () => {
    expect(deriveSnow(0, null)).toBe(0)
    expect(deriveSnow(0.3, null)).toBeNull()
  })

  it('groups periods by date and finds a block’s date through its period', () => {
    expect(precipPeriods(morning).map((p) => p.key)).toEqual(['d1', 'n1', 'd2'])
    expect(periodDateGroups(morning.periods)).toEqual([
      { date: '2026-09-14', span: 2 },
      { date: '2026-09-15', span: 1 },
    ])
    expect(blockDate(afternoon, afternoon.blocks[0])).toBe('2026-09-14')
  })
})

/**
 * One published forecast per issuance, as the public read returns it. Copied from products-api
 * (api/tests/fixtures/nwac_weather_formats), where a test pins them to the template registry: a
 * payload change shows up here as a fixture diff.
 */
describe('the shared example payloads', () => {
  const examples = [exampleMorning, exampleAfternoon].map((wire) =>
    mapV3NWACWeatherIssuance(nwacWeatherForecastSchema.parse(wire)),
  )

  it('parse and map, with the template naming grids only', () => {
    expect(examples.map((i) => i.format)).toEqual([
      'dashboard-v2-2026-09-01',
      'dashboard-v2-2026-09-01',
    ])
    expect(sectionFor(examples[1], 'precip')).toEqual({ id: 'precip', grid: 'precip' })
    expect(examples[1].layout).toEqual({ id: 1, name: 'Example layout' })
    expect(examples[0].sensibleSlots.map((s) => s.label)).toEqual(['Today', 'Tonight'])
    expect(examples[0].extendedBlocks).toEqual([])
  })

  it('list every row of the layout, and the extended outlook’s zones by id', () => {
    const { zones, points, extendedZones } = examples[1]
    expect(zones.map((z) => z.name)).toEqual(['Stevens Pass', 'Snoqualmie Pass', 'Mt Hood'])
    expect(points.map((p) => [p.code, p.zoneId])).toEqual([
      ['STV', 'stevens-pass'],
      ['SNO', 'snoqualmie-pass'],
      ['ALP', 'snoqualmie-pass'],
      ['MHM', 'mt-hood'],
    ])
    expect(extendedZones).toEqual(['stevens-pass', 'mt-hood'])
  })
})
