import { MediaType } from '@/services/nac/model/forecast'
import { avalancheCard, observationCard } from '@/services/nac/observations/cards'
import {
  mapAvalanche,
  mapAvalancheStats,
  mapCombinedZones,
  mapObservation,
  mapPage,
  normalizeDSize,
  toNumber,
} from '@/services/nac/sources/v2/observationMappers'
import {
  avalancheListSchema,
  avalancheRecordSchema,
  avalancheStatsSchema,
  combinedZonesSchema,
  observationListSchema,
  observationRecordSchema,
} from '@/services/nac/types/observationSchemas'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/** Captured from the live obs API on 2026-09-24, observer names and photo credits scrubbed. */
function fixture(name: string): unknown {
  return JSON.parse(readFileSync(join(__dirname, '../e2e/mocks/obs', name), 'utf8'))
}

const observationWire = observationRecordSchema.parse(fixture('observation_detail.json'))
const avalancheWire = avalancheRecordSchema.parse(fixture('avalanche_detail.json'))

describe('observation wire schemas accept real responses', () => {
  it.each([
    ['observation_list_NWAC.json', observationListSchema],
    ['avalanche_list_NWAC.json', avalancheListSchema],
    ['observation_detail.json', observationRecordSchema],
    ['avalanche_detail.json', avalancheRecordSchema],
    ['combined_zones_NWAC.json', combinedZonesSchema],
    ['combined_zones_SNFAC.json', combinedZonesSchema],
    ['avalanche_stats_NWAC.json', avalancheStatsSchema],
    ['avalanche_stats_empty_NWAC.json', avalancheStatsSchema],
  ])('%s', (name, schema) => {
    expect(schema.safeParse(fixture(name)).success).toBe(true)
  })
})

describe('mapObservation', () => {
  const observation = mapObservation(observationWire)

  it('carries the header fields a detail page shows', () => {
    expect(observation).toMatchObject({
      kind: 'observation',
      id: 'd3578079-af36-41b2-b796-01a445da25ee',
      startDate: '2026-03-15',
      zone: { id: '3024', name: 'Stevens Pass' },
      observer: { type: 'forecaster', name: 'Observer Name' },
    })
  })

  it('maps the long-form sections', () => {
    expect(observation.problems.map((problem) => problem.type)).toEqual(['Wind Slab', 'Dry Loose'])
    expect(observation.problems[0].size).toEqual(['1', '2'])
    expect(observation.weather).toEqual({
      airTemp: null,
      cloudCover: 'broken',
      windLoading: 'none',
      rainElevation: null,
      recentSnowfall: '0',
      snowAvailableForTransport: 'large amounts',
    })
    expect(observation.avalanches).toHaveLength(2)
    expect(observation.snowpackMedia[0].type).toBe(MediaType.Image)
  })

  it('hides a name the submitter chose not to show, whatever the record carries', () => {
    const hidden = mapObservation({ ...observationWire, show_name: false, name: 'Leaked Name' })
    expect(hidden.observer.name).toBeNull()
  })

  it('settles the loose shapes older records carry', () => {
    const loose = mapObservation(
      observationRecordSchema.parse({
        id: 'x',
        created_at: '2026-01-01T00:00:00Z',
        location_point: { lat: null, lng: null },
        instability: { cracking: 'true', collapsing: null },
        media: 'not an array',
        advanced_fields: {
          snowpack_media: { 0: 'dashboard object' },
          time_in_field: { start: '7.5', end: 12 },
          avalanche_problems: [{ type: '', d_size: ['', ''] }],
        },
        urls: ['https://example.com/video', '  '],
      }),
    )
    expect(loose.location).toBeNull()
    expect(loose.instability.cracking).toBe(true)
    expect(loose.instability.collapsing).toBe(false)
    expect(loose.media).toEqual([])
    expect(loose.snowpackMedia).toEqual([])
    expect(loose.timeInField).toEqual({ start: 7.5, end: 12 })
    expect(loose.problems).toEqual([])
    expect(loose.urls).toEqual(['https://example.com/video'])
    expect(loose.observer.type).toBe('public')
  })

  it('turns empty and unrecognized media items into unknown rather than failing', () => {
    const parsed = observationRecordSchema.parse({
      id: 'x',
      created_at: '2026-01-01T00:00:00Z',
      media: [null, {}, { type: 'photo', url: 'https://example.com/a.jpg', caption: null }],
    })
    expect(parsed.media.map((item) => item.type)).toEqual([
      MediaType.Unknown,
      MediaType.Unknown,
      MediaType.Photo,
    ])
  })
})

describe('mapAvalanche', () => {
  it('maps a standalone avalanche', () => {
    expect(mapAvalanche(avalancheWire)).toMatchObject({
      kind: 'avalanche',
      dSize: '2.5',
      trigger: 'N',
      number: 12,
      elevation: 5500,
      forecasterVerified: false,
      zone: { name: 'West Slopes South' },
    })
  })

  it('reads numbers stored as text, and absent impacts as zero', () => {
    const avalanche = mapAvalanche({
      ...avalancheWire,
      elevation: '7200',
      number: '',
      humans_caught: null,
      vehicles_damage_cost: '1500.0',
    })
    expect(avalanche.elevation).toBe(7200)
    expect(avalanche.number).toBeNull()
    expect(avalanche.impacts.humansCaught).toBe(0)
    expect(avalanche.impacts.vehiclesDamageCost).toBe(1500)
  })
})

describe('normalizeDSize and toNumber', () => {
  it.each([
    ['D2', '2'],
    ['d3.5', '3.5'],
    ['2.5', '2.5'],
    [3, '3'],
    ['', null],
    [null, null],
    ['D', null],
  ])('%p → %p', (input, expected) => {
    expect(normalizeDSize(input)).toBe(expected)
  })

  it('reads blank and non-numeric text as null', () => {
    expect(toNumber(' 42 ')).toBe(42)
    expect(toNumber('')).toBeNull()
    expect(toNumber('ft')).toBeNull()
  })
})

describe('mapPage', () => {
  it('keeps the avalanche total, which sums `number` rather than counting rows', () => {
    const page = mapPage(
      avalancheListSchema.parse(fixture('avalanche_list_NWAC.json')),
      mapAvalanche,
    )
    expect(page.total).toBe(36)
    expect(page.avalancheCount).toBe(87)
    expect(page.items).toHaveLength(10)
  })

  it('has no avalanche total on the observation list', () => {
    const page = mapPage(
      observationListSchema.parse(fixture('observation_list_NWAC.json')),
      mapObservation,
    )
    expect(page.avalancheCount).toBeNull()
  })
})

describe('mapCombinedZones', () => {
  it('orders forecast zones before observation zones, and frames each', () => {
    const zones = mapCombinedZones(combinedZonesSchema.parse(fixture('combined_zones_SNFAC.json')))
    expect(zones.map((zone) => zone.type)).toEqual([
      'forecast',
      'forecast',
      'forecast',
      'forecast',
      'observation',
      'observation',
      'observation',
    ])
    expect(zones.find((zone) => zone.name === 'Boise Mountains')?.centerIds).toEqual([
      'SNFAC',
      'PAC',
    ])
    for (const zone of zones) expect(zone.bounds).not.toBeNull()
  })
})

describe('cards', () => {
  it('counts an observation’s avalanche media only when it has media of its own', () => {
    const observation = mapObservation(observationWire)
    const own = observation.media.length
    const nested = observation.avalanches.reduce((sum, a) => sum + a.media.length, 0)
    expect(observationCard(observation).media.count).toBe(own + nested)
    expect(observationCard({ ...observation, media: [] }).media).toEqual({
      thumbnail: null,
      count: 0,
    })
  })

  it('names an avalanche’s trigger by its filter group', () => {
    expect(avalancheCard(mapAvalanche({ ...avalancheWire, trigger: 'AR' })).trigger).toBe('Human')
    expect(avalancheCard(mapAvalanche({ ...avalancheWire, trigger: 'AC' })).trigger).toBeNull()
  })
})

describe('mapAvalancheStats', () => {
  // Three months of NWAC avalanches (2026-02-01 to 2026-05-01), which the API buckets by week.
  const stats = mapAvalancheStats(avalancheStatsSchema.parse(fixture('avalanche_stats_NWAC.json')))

  it('keeps the headline total and every breakdown in the API’s order', () => {
    expect(stats.totalAvalanches).toBe(417)
    expect(stats.groupedBy).toBe('zone')
    expect(stats.zones[0]).toEqual({ name: 'West Slopes North', count: 159, showLabel: false })
    expect(stats.triggers.map((t) => t.name)).toEqual(['Natural', 'Human', 'Explosive', 'Unknown'])
    expect(stats.sizes.find((s) => s.name === 'D3')).toMatchObject({ showLabel: false })
    expect(stats.problems).toHaveLength(9)
  })

  it('reads weekly buckets with their period end', () => {
    expect(stats.aggregation).toBe('weekly')
    expect(stats.avalanchesOverTime).toHaveLength(13)
    expect(stats.avalanchesOverTime[1]).toEqual({
      date: '2026-02-08',
      periodEnd: '2026-02-14',
      counts: { D1: 15, D2: 14, D3: 0, 'D4-5': 0 },
    })
    expect(stats.instabilityOverTime[1].counts).toEqual({
      avalanchesObserved: 12,
      crackingCollapsing: 6,
      noInstability: 0,
    })
  })

  it('reads the rose’s bands lowest first, one cell per aspect per band', () => {
    expect(stats.rose.bands[0]).toEqual({ label: '0 - 2,000ft', from: 0, to: 2000 })
    expect(stats.rose.bands).toHaveLength(6)
    expect(stats.rose.cells).toHaveLength(48)
    expect(stats.rose.cells.find((c) => c.aspect === 'N' && c.band === 2)?.count).toBe(47)
  })

  it('treats a day’s bucket as its own period, and an empty window as daily', () => {
    const empty = mapAvalancheStats(
      avalancheStatsSchema.parse(fixture('avalanche_stats_empty_NWAC.json')),
    )
    expect(empty.totalAvalanches).toBe(0)
    expect(empty.aggregation).toBe('daily')
    expect(empty.avalanchesOverTime[0]).toEqual({
      date: '2026-10-12',
      periodEnd: '2026-10-12',
      counts: { D1: 0, D2: 0, D3: 0, 'D4-5': 0 },
    })
    expect(empty.zones).toEqual([])
    expect(empty.problems.every((p) => p.count === 0)).toBe(true)
  })

  it('groups by center when the API did', () => {
    const wire = avalancheStatsSchema.parse(fixture('avalanche_stats_NWAC.json'))
    const byCenter = mapAvalancheStats({
      ...wire,
      metadata: { ...wire.metadata, aggregation_type: 'center' },
    })
    expect(byCenter.groupedBy).toBe('center')
  })
})
