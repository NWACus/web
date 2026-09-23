import {
  blockDate,
  deriveSnow,
  deriveSnowLevel,
  fmtCalendarDate,
  fmtSnowAmount,
  fmtSnowLevel,
  fmtTemp,
  fmtWind,
  periodDateGroups,
  precipPeriods,
  rangeBucket,
  snowLevelBlocks,
  snowLevelTones,
  windBearing,
  windBlocks,
  zoneSnow,
  zonesFor,
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
    expect(fmtTemp({ high: 31, low: 22 })).toBe('31 / 22')
    expect(fmtTemp({ high: 31, low: null })).toBe('—')
    expect(fmtSnowLevel({ freezing: 5000, drop: 1000, mode: 'auto' })).toBe("4,000'")
    expect(fmtWind({ dir: 'SW', speed: 25 })).toBe('SW 25')
    expect(fmtWind({ dir: null, speed: 0 })).toBe('Calm')
    expect(fmtWind(undefined)).toBe('—')
    expect(rangeBucket(3)).toBe('2–4"')
    expect(rangeBucket(0)).toBe('0')
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

  it('averages a zone’s points into a snow bucket', () => {
    const snow = zoneSnow(afternoon, 'olympics', 'n1')
    expect(snow).toBe(deriveSnow(0.24, 11))
    expect(zoneSnow(afternoon, 'nowhere', 'n1')).toBeNull()
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

  it('narrows zones to the avalanche zone a page is for', () => {
    expect(zonesFor(afternoon).length).toBe(10)
    expect(zonesFor(afternoon, 1645).map((z) => z.id)).toEqual(['olympics'])
    expect(zonesFor(afternoon, 999999)).toEqual([])
  })
})
