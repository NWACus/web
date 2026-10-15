import {
  blockDate,
  dayGroups,
  deriveSnow,
  deriveSnowLevel,
  fmtCalendarDate,
  fmtSnowAmount,
  fmtWind,
  levelKind,
  levelTrend,
  periodDateGroups,
  precipPeriods,
  snowLevelBlocks,
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

  it('carries the resolved calendar dates and the precip flag on each period', () => {
    expect(afternoon.periods[0]).toMatchObject({
      key: 'n1',
      kind: 'night',
      date: '2026-09-14',
      precip: true,
    })
    // NWAC's morning issuance runs three periods; precip covers all of them.
    expect(morning.periods.map((p) => p.key)).toEqual(['d1', 'n1', 'd2'])
    expect(morning.periods.map((p) => p.precip)).toEqual([true, true, true])
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
  it('derives snow from QPF and density; the level is the elevation as typed', () => {
    expect(deriveSnow(0.3, 10)).toBe(3)
    expect(deriveSnow(0.24, 11)).toBe(2.2)
    expect(deriveSnow(null, 10)).toBeNull()
    expect(deriveSnow(0.3, 0)).toBeNull()
    expect(deriveSnowLevel(5000)).toBe(5000)
    expect(deriveSnowLevel(0)).toBe(0)
    expect(deriveSnowLevel(null)).toBeNull()
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

  it('lets the data decide which blocks a 6h table shows', () => {
    // The fixture predates the four-block wind axis, so every block carries wind.
    expect(windBlocks(afternoon).map((b) => b.key)).toEqual(afternoon.blocks.map((b) => b.key))
    const trimmed = {
      ...afternoon,
      wind: { olympics: { ev1: { dir: 'W', speed: 10 }, nt1: { dir: 'W', speed: 12 } } },
    }
    expect(windBlocks(trimmed).map((b) => b.key)).toEqual(['ev1', 'nt1'])
    expect(windBlocks({ ...afternoon, wind: {} }).length).toBe(afternoon.blocks.length)
    expect(snowLevelBlocks(morning).length).toBe(6)
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

describe('levelKind', () => {
  const block = afternoon.blocks.find((b) => b.period != null)!
  const zone = afternoon.points.find((p) => p.zoneId)!.zoneId!
  const withPrecip = (qpf: number, mode: string | null = 'auto') => ({
    ...afternoon,
    precip: Object.fromEntries(
      afternoon.points.map((p) => [p.code, { [block.period!]: { qpf, density: 10 } }]),
    ),
    snowLevel: { [zone]: { [block.key]: { freezing: 6000, drop: 1000, mode } } },
  })

  it('reads a wet period as a snow level and a dry one as a freezing level', () => {
    expect(levelKind(withPrecip(0.05), zone, block)).toBe('snow')
    expect(levelKind(withPrecip(0), zone, block)).toBe('freezing')
  })

  it('takes the forecaster’s pick over the precipitation', () => {
    expect(levelKind(withPrecip(0, 'snow'), zone, block)).toBe('snow')
    expect(levelKind(withPrecip(0.5, 'freezing'), zone, block)).toBe('freezing')
  })
})

describe('levelTrend', () => {
  it('says up or down from the level before, nothing when unchanged or unknown', () => {
    expect(levelTrend(3000, 3500)).toBe('up')
    expect(levelTrend(3500, 3000)).toBe('down')
    expect(levelTrend(3000, 3000)).toBeNull()
    expect(levelTrend(undefined, 3000)).toBeNull()
    expect(levelTrend(3000, null)).toBeNull()
  })
})

describe('dayGroups', () => {
  const period = (key: string, kind: 'day' | 'night') => ({
    key,
    label: key,
    short: null,
    kind,
    date: '2026-10-14',
    precip: true,
  })

  it('pairs each night with the day after it, a lone period on its own', () => {
    const groups = dayGroups([
      period('d1', 'day'),
      period('n1', 'night'),
      period('d2', 'day'),
      period('n2', 'night'),
    ])
    expect(groups.map((g) => [g.key, g.partial])).toEqual([
      ['d1', 'Day only'],
      ['n1-d2', null],
      ['n2', 'Night only'],
    ])
  })
})
