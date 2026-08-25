// Contract tests for the legacy-shape shim. The Avy app's zod schema
// (hooks/useNWACWeatherForecast.ts) is the executable contract, ported here
// verbatim; two goldens captured from the live nwac.us API (2026-02-01,
// Olympics PM + Snoqualmie AM) prove the ported schema matches the real
// legacy wire shape, and the shim's output must satisfy the same schema.
import { buildLegacyWeatherResponse } from '@/services/products/mwf/legacyShim'
import type { MwfPublicForecast } from '@/services/products/mwf/source'
import { MWF_STRUCTURE } from '@/utilities/mwf/structure'
import { z } from 'zod'
import olympicsPmGolden from './fixtures/mwf/legacy-golden-olympics-pm.json'
import snoqualmieAmGolden from './fixtures/mwf/legacy-golden-snoqualmie-am.json'

// --- The Avy app contract, ported verbatim ---------------------------------
const TimeOfDay = {
  '': '0-notspec',
  Morning: '1-morning',
  'Mid-day': '1a-midday',
  Afternoon: '2-afternoon',
  Evening: '3-evening',
  Night: '4-night',
} as const

const nwacWeatherForecastSchema = z.object({
  five_thousand_foot_temperatures: z.array(
    z.object({
      min: z.number(),
      max: z.number(),
    }),
  ),
  forecaster: z.object({
    first_name: z.string(),
    last_name: z.string(),
  }),
  mountain_weather_forecast: z.object({
    id: z.number(),
    creation_date: z.string().transform((s) => s.replace(' ', 'T') + '+00:00'),
    publish_date: z.string().transform((s) => s.replace(' ', 'T') + '+00:00'),
    day1_date: z.string(),
    special_header_notes: z.string(),
    synopsis_day1_day2: z.string(),
    extended_synopsis: z.string(),
    afternoon: z.coerce.boolean(),
  }),
  periods: z.array(z.string()),
  sub_periods: z.array(z.string()),
  precipitation_by_location: z.array(
    z.object({
      name: z.string(),
      order: z.number(),
      precipitation: z.array(
        z.object({
          value: z.string(),
        }),
      ),
    }),
  ),
  snow_levels: z.array(z.object({ elevation: z.number() })),
  ridgeline_winds: z.array(
    z.object({
      direction: z.string().nullable(),
      speed: z.string().nullable(),
    }),
  ),
  weather_forecasts: z.array(
    z.object({
      date: z.string(),
      time_of_day: z.nativeEnum(TimeOfDay),
      description: z.string(),
    }),
  ),
})

const nwacWeatherForecastMetaSchema = z.object({
  meta: z.object({
    limit: z.number().optional().nullable(),
    next: z.string().optional().nullable(),
    offset: z.number().optional().nullable(),
    previous: z.string().optional().nullable(),
    total_count: z.number().optional().nullable(),
  }),
  objects: nwacWeatherForecastSchema,
})

// --- A published forecast as the shim receives it --------------------------
function nativeForecast(issuance: 'morning' | 'afternoon'): MwfPublicForecast {
  const zones = [
    { id: 'olympics', name: 'Olympics' },
    { id: 'stevens-pass', name: 'Stevens Pass' },
  ]
  const points = [
    { code: 'hurricane-ridge', name: 'Hurricane Ridge', zone: 'olympics', lat: 1, lng: 2 },
    { code: 'stevens-pass', name: 'Stevens Pass', zone: 'stevens-pass', lat: 1, lng: 2 },
  ]
  const slice = MWF_STRUCTURE.issuances[issuance]
  const precip: NonNullable<MwfPublicForecast['body']['precip']> = {}
  const snowLevel: NonNullable<MwfPublicForecast['body']['snowLevel']> = {}
  const temps: NonNullable<MwfPublicForecast['body']['temps']> = {}
  const wind: NonNullable<MwfPublicForecast['body']['wind']> = {}
  points.forEach((pt) => {
    precip[pt.code] = {}
    slice.periods.forEach((k, i) => {
      precip[pt.code][k] = { qpf: 0.1 * (i + 1), density: 10 }
    })
  })
  zones.forEach((zn) => {
    snowLevel[zn.id] = {}
    wind[zn.id] = {}
    temps[zn.id] = {}
    slice.periods.forEach((k, i) => {
      temps[zn.id][k] = { high: 30 + i, low: 20 + i }
    })
    slice.blocks.forEach((k, i) => {
      snowLevel[zn.id][k] = { freezing: 5000 + i * 500, drop: 1000, mode: 'auto' }
      wind[zn.id][k] = { dir: 'SW', speed: 15 + i }
    })
  })
  const body: MwfPublicForecast['body'] = {
    precip,
    snowLevel,
    temps,
    wind,
    sensible: {
      olympics: { morning: 'Rain and snow showers.', afternoon: 'Clearing trend.' },
      'stevens-pass': { morning: 'Snow.', afternoon: 'Breaks of sun.' },
    },
    discussion: { synopsis: 'A front moves through.', extended: 'Ridging builds midweek.' },
  }
  return {
    id: 4178,
    issuance,
    serviceDate: '2026-02-01',
    issuedAt: '2026-02-01T22:15:15.000Z',
    createdAt: '2026-02-01T20:41:11.000Z',
    revision: 1,
    isCorrection: false,
    body,
    config: { zones, points, extendedZoneIds: [] },
    structure: MWF_STRUCTURE,
  }
}

describe('the ported contract matches the live legacy API', () => {
  it.each([
    ['Olympics PM', olympicsPmGolden],
    ['Snoqualmie AM', snoqualmieAmGolden],
  ])('golden %s parses', (_label, golden) => {
    const parsed = nwacWeatherForecastMetaSchema.safeParse(golden)
    if (!parsed.success) throw parsed.error
    expect(parsed.data.objects.periods.length).toBe(2)
  })
})

describe('the shim satisfies the app contract', () => {
  it.each(['morning', 'afternoon'] as const)('%s issuance parses', (issuance) => {
    const response = buildLegacyWeatherResponse({
      forecast: nativeForecast(issuance),
      zoneId: 'olympics',
      authorName: 'Robert Hahn',
    })
    const parsed = nwacWeatherForecastMetaSchema.safeParse(response)
    if (!parsed.success) throw parsed.error
    const o = parsed.data.objects
    // The legacy zone window: first two periods, four sub-period blocks.
    expect(o.periods).toHaveLength(2)
    expect(o.sub_periods).toHaveLength(4)
    expect(o.five_thousand_foot_temperatures).toHaveLength(2)
    expect(o.snow_levels).toHaveLength(4)
    expect(o.ridgeline_winds).toHaveLength(4)
    expect(o.forecaster).toEqual({ first_name: 'Robert', last_name: 'Hahn' })
    expect(o.mountain_weather_forecast.afternoon).toBe(issuance === 'afternoon')
    // Zone scoping: only the zone's own points appear.
    expect(o.precipitation_by_location.map((p) => p.name)).toEqual(['Hurricane Ridge'])
  })

  it('matches the golden window semantics per issuance', () => {
    const am = buildLegacyWeatherResponse({
      forecast: nativeForecast('morning'),
      zoneId: 'olympics',
    })
    const pm = buildLegacyWeatherResponse({
      forecast: nativeForecast('afternoon'),
      zoneId: 'olympics',
    })
    // AM: Day 1 + Night 1 (golden: ['Sunday', 'Sunday Night'], Morning-first)
    expect(am?.objects.periods).toEqual(['Sunday', 'Sunday Night'])
    expect(am?.objects.sub_periods).toEqual(['Morning', 'Afternoon', 'Evening', 'Overnight'])
    // PM: Night 1 + Day 2 (golden: ['Sunday Night', 'Monday'], Evening-first)
    expect(pm?.objects.periods).toEqual(['Sunday Night', 'Monday'])
    expect(pm?.objects.sub_periods).toEqual(['Evening', 'Overnight', 'Morning', 'Afternoon'])
    // Snow level derives from freezing − drop.
    expect(am?.objects.snow_levels[0].elevation).toBe(4000)
    // PM tonight slot carries the 4-night time_of_day (golden pair).
    expect(pm?.objects.weather_forecasts[0].time_of_day).toBe('4-night')
    expect(am?.objects.weather_forecasts[0].time_of_day).toBe('0-notspec')
  })

  it('returns null for a zone the forecast does not carry', () => {
    expect(
      buildLegacyWeatherResponse({ forecast: nativeForecast('morning'), zoneId: 'nope' }),
    ).toBeNull()
  })
})
