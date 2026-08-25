// Parity baseline for the MWF forecast-logic port. This suite is dashboard-v2's
// test/unit/components/forecaster/mwfData.test.js ported from vitest to jest,
// with expectations updated for dashboard-v2 PR #158 (morning window through
// Night 2, 7am AM default, QPF over-precision flag) and added coverage for the
// AvyWeb Settings adapters. Drift from Rachel's editor behavior should surface
// here first.
import {
  DEFAULT_DROP_FT,
  airfireCodeMap,
  applyGuidance,
  applyTempsGuidance,
  applyWindsGuidance,
  blocksFor,
  deriveSnow,
  deriveSnowLevel,
  emptyForecast,
  extendedBlocksFor,
  hydrateForecast,
  normalizeConfigPoints,
  periodDate,
  periodsFor,
  pointsFromSettings,
  qpfOverPrecise,
  serializeForecast,
  shiftBodyToAnchor,
  summarizeMissing,
  validateForecast,
  zoneBlockQpf,
  zoneSlug,
  zonesFromSettings,
} from '@/utilities/mwf/mwfData'

const ZONES = [
  { id: 'olympics', name: 'Olympics' },
  { id: 'stevens', name: 'Stevens Pass' },
]
const POINTS = [
  { code: 'HUR', name: 'Hurricane Ridge', zone: 'olympics', lat: 47.9, lng: -123.4 },
  { code: 'OLY2', name: 'Second Olympic', zone: 'olympics', lat: 47.8, lng: -123.5 },
  { code: 'STS', name: 'Stevens Pass', zone: 'stevens', lat: 47.7, lng: -121.0 },
]

describe('issuance windows', () => {
  it('morning covers Day 1 → Night 2 (PR #158); afternoon shifts to Night 1 → Day 3', () => {
    expect(periodsFor('morning').map((p) => p.key)).toEqual(['d1', 'n1', 'd2', 'n2'])
    expect(periodsFor('afternoon').map((p) => p.key)).toEqual(['n1', 'd2', 'n2', 'd3'])
    expect(blocksFor('morning').map((b) => b.key)).toEqual([
      'am1',
      'pm1',
      'ev1',
      'nt1',
      'am2',
      'pm2',
      'ev2',
      'nt2',
    ])
    expect(blocksFor('afternoon').map((b) => b.key)).toEqual([
      'ev1',
      'nt1',
      'am2',
      'pm2',
      'ev2',
      'nt2',
      'am3',
      'pm3',
    ])
  })

  it('the extended outlook exists for afternoon issuances only', () => {
    expect(extendedBlocksFor('afternoon').map((b) => b.key)).toEqual(['nt3', 'am4', 'nt4', 'day5'])
    expect(extendedBlocksFor('morning')).toEqual([])
  })
})

describe('periodDate', () => {
  it('parses the anchor as a LOCAL date (no UTC off-by-one)', () => {
    expect(periodDate('2026-07-14')).toBe('Tue Jul 14')
  })

  it('offsets by calendar days from Day 1', () => {
    expect(periodDate('2026-07-14', 2)).toBe('Thu Jul 16')
    // Month rollover
    expect(periodDate('2026-07-31', 1)).toBe('Sat Aug 1')
  })
})

describe('default issue times', () => {
  const at = new Date(2026, 6, 14, 4, 30)

  it('morning issuances default to 7am (PR #158; was 6am)', () => {
    const fc = emptyForecast(ZONES, POINTS, 'morning', at)
    expect(fc.meta.issued).toBe('2026-07-14T07:00')
    expect(fc.meta.initialDate).toBe('2026-07-14')
  })

  it('afternoon issuances default to 3pm', () => {
    const fc = emptyForecast(ZONES, POINTS, 'afternoon', at)
    expect(fc.meta.issued).toBe('2026-07-14T15:00')
  })
})

describe('derivations', () => {
  it('snow = QPF × 100 / density, rounded to a tenth', () => {
    expect(deriveSnow(1.0, 10)).toBe(10)
    expect(deriveSnow(0.33, 10)).toBe(3.3)
    expect(deriveSnow(0.5, 8)).toBe(6.3)
  })

  it('snow is null when inputs are missing or density is zero (the 0-quick-set)', () => {
    expect(deriveSnow(null, 10)).toBeNull()
    expect(deriveSnow('', 10)).toBeNull()
    expect(deriveSnow(0.5, 0)).toBeNull()
    expect(deriveSnow(0.5, null)).toBeNull()
    // An entered 0 QPF with a density is a real (zero) amount, not missing.
    expect(deriveSnow(0, 10)).toBe(0)
  })

  it('snow level = freezing − drop, clamped at 0, defaulting the drop', () => {
    expect(deriveSnowLevel(5000, 1000)).toBe(4000)
    expect(deriveSnowLevel(5000, undefined)).toBe(5000 - DEFAULT_DROP_FT)
    expect(deriveSnowLevel(500, 1000)).toBe(0)
    expect(deriveSnowLevel(null, 1000)).toBeNull()
    expect(deriveSnowLevel('', 1000)).toBeNull()
  })

  it('flags QPF finer than hundredths of an inch (PR #158)', () => {
    expect(qpfOverPrecise(0.125)).toBe(true)
    expect(qpfOverPrecise('0.125')).toBe(true)
    expect(qpfOverPrecise(0.12)).toBe(false)
    expect(qpfOverPrecise(0.1)).toBe(false)
    expect(qpfOverPrecise(2)).toBe(false)
    expect(qpfOverPrecise(0)).toBe(false)
    expect(qpfOverPrecise(null)).toBe(false)
    expect(qpfOverPrecise('')).toBe(false)
  })
})

describe('zoneBlockQpf (snow-vs-freezing designation driver)', () => {
  const precip = {
    HUR: { n1: { qpf: 0.4 }, d2: { qpf: 0 } },
    OLY2: { n1: { qpf: 0 }, d2: { qpf: 0 } },
    STS: { n1: { qpf: 0.2 } },
  }

  it('is the MEAN of the zone points for the block parent period', () => {
    // ev1/nt1 belong to n1: Olympics mean = (0.4 + 0) / 2
    expect(zoneBlockQpf(precip, POINTS, 'olympics', 'ev1')).toBeCloseTo(0.2)
    expect(zoneBlockQpf(precip, POINTS, 'olympics', 'nt1')).toBeCloseTo(0.2)
    expect(zoneBlockQpf(precip, POINTS, 'stevens', 'ev1')).toBeCloseTo(0.2)
  })

  it('a single wet point can be diluted below the designation threshold', () => {
    // This is why one point with light precip may not flip a multi-point zone.
    const light = { HUR: { n1: { qpf: 0.008 } }, OLY2: { n1: { qpf: 0 } } }
    expect(zoneBlockQpf(light, POINTS, 'olympics', 'ev1')).toBeLessThan(0.005)
  })

  it('is 0 for dry periods, unknown blocks, and zones without points', () => {
    expect(zoneBlockQpf(precip, POINTS, 'olympics', 'am2')).toBe(0)
    expect(zoneBlockQpf(precip, POINTS, 'olympics', 'nope')).toBe(0)
    expect(zoneBlockQpf(precip, [], 'olympics', 'ev1')).toBe(0)
  })
})

describe('normalizeConfigPoints', () => {
  it('maps zone NAMES from config to zone ids and drops codeless entries', () => {
    const raw = [
      { code: 'HUR', name: 'Hurricane Ridge', zone: 'Olympics', lat: 1, lng: 2 },
      { code: '', name: 'ghost', zone: 'Olympics' },
      { code: 'MYS', name: 'Mystery', zone: 'Unknown Zone' },
    ]
    const out = normalizeConfigPoints(raw, ZONES)
    expect(out.map((p) => p.code)).toEqual(['HUR', 'MYS'])
    expect(out[0].zone).toBe('olympics')
    // Unmapped names pass through (visible in the grid, findable in review).
    expect(out[1].zone).toBe('Unknown Zone')
  })
})

describe('Settings adapters', () => {
  const settingsZones = [
    { code: 'olympics', name: 'Olympics', airfireZoneId: 'ol' },
    { code: 'stevens-pass', name: 'Stevens Pass', airfireZoneId: 'st' },
    { code: '', name: 'ghost' },
  ]

  it('zonesFromSettings keys zones by their configured code', () => {
    expect(zonesFromSettings(settingsZones)).toEqual([
      { id: 'olympics', name: 'Olympics' },
      { id: 'stevens-pass', name: 'Stevens Pass' },
    ])
    expect(zonesFromSettings(null)).toEqual([])
  })

  it('pointsFromSettings maps zoneCode/latitude/longitude onto the model shape', () => {
    const out = pointsFromSettings([
      {
        code: 'HUR',
        name: 'Hurricane Ridge',
        zoneCode: 'olympics',
        latitude: 47.9,
        longitude: -123.4,
      },
    ])
    expect(out).toEqual([
      { code: 'HUR', name: 'Hurricane Ridge', zone: 'olympics', lat: 47.9, lng: -123.4 },
    ])
  })

  it('airfireCodeMap inverts the configured Airfire ids (config, not hardcoded)', () => {
    expect(airfireCodeMap(settingsZones)).toEqual({ ol: 'olympics', st: 'stevens-pass' })
  })

  it('zoneSlug derives ids from display names as the fallback identity', () => {
    expect(zoneSlug('West Slopes North')).toBe('west-slopes-north')
    expect(zoneSlug('Mt. Hood!')).toBe('mt-hood')
  })
})

describe('serialize / hydrate round-trip', () => {
  it('persists entered values only — guidance never reaches the body', () => {
    const fc = emptyForecast(ZONES, POINTS, 'afternoon')
    fc.precip.HUR.n1.qpf = 0.25
    fc.precip.HUR.n1.density = 10
    fc.precip.HUR.n1.guidance = { WRF: 0.4 }
    fc.temps.olympics.d2.high = 31
    fc.wind.stevens.ev1.dir = 'SW'
    fc.wind.stevens.ev1.speed = 25
    fc.snowLevel.olympics.ev1.freezing = 5000
    fc.discussion.synopsis = 'Snow.'

    const body = serializeForecast(fc)
    expect(body.precip.HUR.n1).toEqual({ qpf: 0.25, density: 10 })
    expect(JSON.stringify(body)).not.toContain('guidance')

    const fresh = emptyForecast(ZONES, POINTS, 'afternoon')
    hydrateForecast(fresh, body)
    expect(fresh.precip.HUR.n1.qpf).toBe(0.25)
    expect(fresh.temps.olympics.d2.high).toBe(31)
    expect(fresh.wind.stevens.ev1).toMatchObject({ dir: 'SW', speed: 25 })
    expect(fresh.snowLevel.olympics.ev1.freezing).toBe(5000)
    expect(fresh.discussion.synopsis).toBe('Snow.')
    // Guidance slots exist again, empty, ready for live overlay.
    expect(fresh.precip.HUR.n1.guidance).toEqual({})
  })

  it('hydrate is non-destructive for cells the current config no longer has', () => {
    const fc = emptyForecast(ZONES, POINTS, 'morning')
    const body = { precip: { GONE: { d1: { qpf: 9, density: null } } }, meta: fc.meta }
    expect(() => hydrateForecast(fc, body)).not.toThrow()
    expect(fc.precip.GONE).toBeUndefined()
  })
})

describe('shiftBodyToAnchor (copy-forward re-anchoring)', () => {
  function afternoonBody() {
    const fc = emptyForecast(ZONES, POINTS, 'afternoon')
    fc.meta.initialDate = '2026-07-14'
    fc.precip.HUR.n1.qpf = 0.1 // Jul 14 night
    fc.precip.HUR.d2.qpf = 0.2 // Jul 15
    fc.precip.HUR.d3.qpf = 0.3 // Jul 16
    fc.snowLevel.olympics.am2.freezing = 4500 // Jul 15 morning
    fc.extendedSnowLevel = {
      olympics: {
        nt3: { freezing: 4000, drop: 1000, mode: 'auto' },
        nt4: { freezing: 3500, drop: 1000, mode: 'auto' },
      },
    }
    return fc
  }

  it('same anchor passes through unchanged', () => {
    const out = shiftBodyToAnchor(afternoonBody(), '2026-07-14')
    expect(out.precip.HUR.n1.qpf).toBe(0.1)
    expect(out.precip.HUR.d3.qpf).toBe(0.3)
  })

  it('PM → next-morning: every value stays on its absolute half-day', () => {
    const out = shiftBodyToAnchor(afternoonBody(), '2026-07-15')
    // Jul 15 was the source's d2; it is the new forecast's d1.
    expect(out.precip.HUR.d1.qpf).toBe(0.2)
    // Jul 16 (source d3) becomes the new d2.
    expect(out.precip.HUR.d2.qpf).toBe(0.3)
    // The new n2 (Jul 16 night) was beyond the source horizon → blank.
    expect(out.precip.HUR.n2.qpf).toBeNull()
    // Blocks shift the same way: source am2 (Jul 15 AM) → new am1.
    expect(out.snowLevel.olympics.am1.freezing).toBe(4500)
    // Extended: nt3 (Jul 17 night in the new frame) ← source nt4.
    expect(out.extendedSnowLevel.olympics.nt3.freezing).toBe(3500)
    // Slots the source never forecast go blank, not stale.
    expect(out.extendedSnowLevel.olympics.nt4.freezing).toBeNull()
  })
})

describe('guidance overlays', () => {
  it('applyGuidance fills the SHOWN periods by position and never touches entered values', () => {
    const fc = emptyForecast(ZONES, POINTS, 'morning')
    fc.precip.HUR.d1.qpf = 0.5 // forecaster-entered
    const artifact = {
      periods: [
        { points: { HUR: { 'WRF(UW) 1.33km': 0.11 } } },
        { points: { HUR: { 'WRF(UW) 1.33km': 0.22 } } },
      ],
    }
    const applied = applyGuidance(fc, artifact)
    expect(applied).toBe(2)
    expect(fc.precip.HUR.d1.guidance['WRF(UW) 1.33km']).toBe(0.11)
    expect(fc.precip.HUR.n1.guidance['WRF(UW) 1.33km']).toBe(0.22)
    expect(fc.precip.HUR.d1.qpf).toBe(0.5)
  })

  const CODE_MAP = { ol: 'olympics', st: 'stevens' }

  it('applyTempsGuidance maps artifact zone codes through the configured map', () => {
    const fc = emptyForecast(ZONES, POINTS, 'morning')
    const applied = applyTempsGuidance(
      fc,
      {
        periods: [
          { zones: { ol: { GFS: { high: 30, low: 21 } }, xx: { GFS: { high: 1, low: 0 } } } },
        ],
      },
      CODE_MAP,
    )
    expect(applied).toBe(1)
    expect(fc.temps.olympics.d1.guidance.GFS).toEqual({ high: 30, low: 21 })
  })

  it('applyWindsGuidance maps artifact zone codes and skips partial values', () => {
    const fc = emptyForecast(ZONES, POINTS, 'morning')
    const applied = applyWindsGuidance(
      fc,
      {
        blocks: [
          { zones: { st: { GFS: { speed: 25, dir: 'SW' } } } },
          { zones: { st: { GFS: { speed: 30, dir: null } } } },
        ],
      },
      CODE_MAP,
    )
    expect(applied).toBe(1)
    expect(fc.wind.stevens.am1.guidance.GFS).toEqual({ speed: 25, dir: 'SW' })
    expect(fc.wind.stevens.pm1.guidance.GFS).toBeUndefined()
  })
})

describe('validateForecast (publish gate)', () => {
  const EXT = [{ id: 'olympics', name: 'Olympics' }]

  function completeForecast(type: 'morning' | 'afternoon' = 'afternoon') {
    const fc = emptyForecast(ZONES, POINTS, type)
    const periods = periodsFor(type).map((p) => p.key)
    POINTS.forEach((pt) => {
      periods.forEach((k) => {
        fc.precip[pt.code][k].qpf = 0.1
        fc.precip[pt.code][k].density = 10
      })
    })
    ZONES.forEach((z) => {
      periods.forEach((k) => {
        fc.temps[z.id][k].high = 30
        fc.temps[z.id][k].low = 20
      })
      Object.keys(fc.snowLevel[z.id]).forEach((bk) => {
        fc.snowLevel[z.id][bk].freezing = 5000
        fc.wind[z.id][bk].dir = 'SW'
        fc.wind[z.id][bk].speed = 15
      })
      fc.sensible[z.id].morning = 'Snow showers.'
      fc.sensible[z.id].afternoon = 'Clearing.'
    })
    if (type === 'afternoon') {
      fc.extendedSnowLevel = {
        olympics: Object.fromEntries(
          extendedBlocksFor('afternoon').map((b) => [
            b.key,
            { freezing: 4500, drop: 1000, mode: 'auto' },
          ]),
        ),
      }
    }
    fc.discussion.synopsis = 'Synopsis.'
    fc.discussion.extended = 'Extended.'
    return fc
  }

  it('a fully filled forecast validates clean', () => {
    const fc = completeForecast('afternoon')
    expect(validateForecast(fc, { zones: ZONES, points: POINTS, extendedZones: EXT })).toEqual([])
  })

  it('flags each missing visible input with section and location', () => {
    const fc = completeForecast('afternoon')
    fc.precip.HUR.d2.qpf = null
    fc.temps.stevens.n1.low = null
    fc.wind.olympics.ev1.dir = ''
    fc.snowLevel.olympics.am2.freezing = null
    fc.sensible.stevens.afternoon = ''
    fc.discussion.synopsis = ''
    const missing = validateForecast(fc, {
      zones: ZONES,
      points: POINTS,
      extendedZones: EXT,
    })
    const sections = missing.map((m) => m.section)
    expect(sections).toContain('Precip')
    expect(sections).toContain('Temps')
    expect(sections).toContain('Wind')
    expect(sections).toContain('Snow/Freezing')
    expect(sections).toContain('Sensible weather')
    expect(sections).toContain('Discussion')
    expect(missing).toHaveLength(6)
  })

  it('rejects a high temperature below the low', () => {
    const fc = completeForecast('afternoon')
    fc.temps.olympics.d2.high = 20
    fc.temps.olympics.d2.low = 30
    const missing = validateForecast(fc, {
      zones: ZONES,
      points: POINTS,
      extendedZones: EXT,
    })
    expect(missing).toEqual([{ section: 'Temps', where: 'Olympics D2', field: 'high below low' }])
    // Equal high/low is fine (an isothermal period).
    fc.temps.olympics.d2.high = 30
    expect(validateForecast(fc, { zones: ZONES, points: POINTS, extendedZones: EXT })).toEqual([])
  })

  it('density is required only where QPF > 0', () => {
    const fc = completeForecast('afternoon')
    fc.precip.HUR.d2.qpf = 0 // dry: density may be blank
    fc.precip.HUR.d2.density = null
    fc.precip.STS.d2.density = null // wet (0.1): density required
    const missing = validateForecast(fc, {
      zones: ZONES,
      points: POINTS,
      extendedZones: EXT,
    })
    expect(missing).toEqual([{ section: 'Precip', where: 'STS D2', field: 'density' }])
  })

  it('flags over-precise QPF at publish (PR #158)', () => {
    const fc = completeForecast('afternoon')
    fc.precip.HUR.d2.qpf = 0.125
    const missing = validateForecast(fc, {
      zones: ZONES,
      points: POINTS,
      extendedZones: EXT,
    })
    expect(missing).toEqual([{ section: 'Precip', where: 'HUR D2', field: 'QPF precision' }])
  })

  it('only the issuance-visible surface is validated', () => {
    // A morning forecast: d3/extended never validated, even if cells exist.
    const fc = completeForecast('morning')
    fc.precip.HUR.d3.qpf = null // not shown for morning
    expect(validateForecast(fc, { zones: ZONES, points: POINTS, extendedZones: EXT })).toEqual([])
  })

  it('extended outlook zones are required for afternoon issuances', () => {
    const fc = completeForecast('afternoon')
    fc.extendedSnowLevel.olympics.nt4.freezing = null
    const missing = validateForecast(fc, {
      zones: ZONES,
      points: POINTS,
      extendedZones: EXT,
    })
    expect(missing).toEqual([
      { section: 'Extended snow level', where: 'Olympics Night', field: 'level' },
    ])
  })

  it('summarizeMissing groups by section with counts and examples', () => {
    const lines = summarizeMissing([
      { section: 'Precip', where: 'HUR D2', field: 'QPF' },
      { section: 'Precip', where: 'STS D2', field: 'QPF' },
      { section: 'Wind', where: 'Olympics Eve 1', field: 'speed' },
    ])
    expect(lines).toEqual([
      'Precip: 2 missing (HUR D2 QPF, STS D2 QPF)',
      'Wind: 1 missing (Olympics Eve 1 speed)',
    ])
  })
})
