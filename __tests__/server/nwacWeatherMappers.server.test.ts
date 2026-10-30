import {
  blockDate,
  dayGroups,
  deriveSnow,
  deriveSnowLevel,
  fmtCalendarDate,
  fmtSnowAmount,
  fmtWind,
  levelKind,
  periodDateGroups,
  precipPeriods,
  sensibleSlots,
  snowLevelBlocks,
  snowRange,
  snowTier,
  windBearing,
  windBlocks,
  windRange,
  windWording,
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
    expect(afternoon.precip.HUR53.n1).toEqual({ qpf: 0.24, slr: 11 })
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
  it('snow = QPF × SLR to a tenth; the level is the elevation as typed', () => {
    expect(deriveSnow(0.3, 10)).toBe(3)
    expect(deriveSnow(0.24, 11)).toBe(2.6)
    expect(deriveSnow(0.5, 15)).toBe(7.5)
    expect(deriveSnow(null, 10)).toBeNull()
    // SLR 0 is the dry marker: rain, not snow, however much water falls.
    expect(deriveSnow(0.3, 0)).toBeNull()
    expect(deriveSnow(0.4, 0)).toBeNull()
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
  })

  it('reads snow and wind to the public as ranges', () => {
    expect(snowRange(null)).toBe('—')
    expect(snowRange(NaN)).toBe('—')
    expect(snowRange(0)).toBe('0')
    expect(snowRange(0.1)).toBe('T–1"')
    expect(snowRange(0.7)).toBe('T–1"')
    expect(snowRange(0.8)).toBe('0.5–2"')
    expect(snowRange(1.5)).toBe('1–3"')
    expect(snowRange(3)).toBe('2–4"')
    expect(snowRange(6.4)).toBe('5–7"')
    expect(snowRange(6.5)).toBe('5–9"')
    expect(snowRange(14.5)).toBe('12–18"')
    expect(snowRange(19.5)).toBe('16–24"')
    expect(snowRange(24.5)).toBe('20–30"')
    expect(snowRange(33.5)).toBe('28–40"')
    expect(snowRange(40)).toBe('34–46"')
    expect(snowRange(40.1)).toBe('36–50"')
    expect(snowTier(0)).toBeNull()
    expect(snowTier(0.1)).toBe(0)
    expect(snowTier(1.5)).toBe(1)
    expect(snowTier(6.5)).toBe(2)
    expect(snowTier(14.5)).toBe(3)
    expect(windRange(0)).toBe('0–5')
    expect(windRange(5)).toBe('5–10')
    expect(windRange(12)).toBe('10–15')
    expect(windRange(25)).toBe('20–30')
    expect(windRange(44)).toBe('40–55')
    expect(windRange(84)).toBe('70–90')
    expect(windRange(110)).toBe('85–110')
    expect(windRange(111)).toBe('110+')
    expect(windRange(null)).toBeNull()
    expect(windWording(0)).toBe('Calm')
    expect(windWording(12)).toBe('Light to occasionally Moderate')
    expect(windWording(25)).toBe('Moderate to Strong')
    expect(windWording(40)).toBe('Strong to Extreme')
    expect(windWording(120)).toBe('Extreme')
    expect(windWording(null)).toBeNull()
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
  const block = afternoon.blocks.find((b) => b.period != null)
  const zone = afternoon.points.find((p) => p.zoneId)?.zoneId
  if (!block?.period || !zone) throw new Error('fixture should have a wet block and a zoned point')
  const period = block.period
  const withPrecip = (qpf: number, mode: string | null = 'auto') => ({
    ...afternoon,
    precip: Object.fromEntries(
      afternoon.points.map((p) => [p.code, { [period]: { qpf, slr: 10 } }]),
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

describe('sensibleSlots', () => {
  it("labels an afternoon issuance's first day Tonight and a morning one's Today / Tonight", () => {
    expect(sensibleSlots(afternoon).map((s) => s.label)).toEqual(['Tonight', 'Tomorrow'])
    expect(sensibleSlots(morning).map((s) => s.label)).toEqual(['Today / Tonight', 'Tomorrow'])
    expect(sensibleSlots({ ...morning, periods: [] })[0]).toMatchObject({
      label: 'Today / Tonight',
      date: null,
    })
  })
})
