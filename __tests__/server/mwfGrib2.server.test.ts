// The grib2 QPF driver, ported from products-api's mwf_qpf.py: URL/match
// token filling, accumulation-window and unit-conversion config validation,
// END-hour period placement `(start, end]`, raw-line .idx matching with
// excludes (the NBM multi-APCP case), byte-range math, sentinel-fh cycle
// probing with fallback, and the full fetch→decode→sample→accumulate spine
// against a REAL recorded HRRR record.
//
// Fixture provenance (recorded 2026-08-26):
//   https://noaa-hrrr-bdp-pds.s3.amazonaws.com/hrrr.20260825/conus/hrrr.t12z.wrfsfcf06.grib2
//   .idx lines 80–95 → fixtures/mwf/hrrr-20260825-t12z-f06.idx
//   bytes 59518687–59837656 (the `APCP:surface:5-6 hour acc fcst` record,
//   complex packing, lambert 1799x1059) → fixtures/mwf/hrrr-20260825-t12z-f06-apcp.grib2
//   Ground truth at recording time: 11.102 mm at the gridpoint nearest Tampa
//   (27.95, -82.46), 0 mm at Snoqualmie Pass (47.4247, -121.4135).
import {
  GRIB_DEFAULT_PERIODS,
  buildGrib2Model,
  deriveMatch,
  excludeList,
  extractPointValues,
  fillGribUrl,
  fillMatch,
  findRecordIndex,
  inPeriod,
  matchWindow,
  parseIdxText,
  recordRange,
  selectCycle,
  sourceDivisor,
  type Grib2Fetch,
  type Grib2GridCache,
} from '@/services/mwf/grib2'
import { buildQpfGuidance, type FetchJson } from '@/services/mwf/guidance'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const FIXTURES = path.join(__dirname, 'fixtures', 'mwf')
const IDX_TEXT = readFileSync(path.join(FIXTURES, 'hrrr-20260825-t12z-f06.idx'), 'utf-8')
const RECORD_BYTES = new Uint8Array(
  readFileSync(path.join(FIXTURES, 'hrrr-20260825-t12z-f06-apcp.grib2')),
)

const TAMPA_MM = 11.102

const POINTS = [
  { code: 'TPA', lat: 27.95, lng: -82.46 },
  { code: 'SNQ', lat: 47.4247, lng: -121.4135 },
]

const HRRR_TEMPLATE =
  'https://noaa-hrrr-bdp-pds.s3.amazonaws.com/hrrr.{date}/conus/hrrr.t{cycle}z.wrfsfcf{fh02}.grib2'

describe('token filling', () => {
  const cycle = new Date('2026-08-25T12:00:00Z')

  it('fills {date} {cycle} {fh02} into the HRRR template', () => {
    expect(fillGribUrl(HRRR_TEMPLATE, cycle, 6)).toBe(
      'https://noaa-hrrr-bdp-pds.s3.amazonaws.com/hrrr.20260825/conus/hrrr.t12z.wrfsfcf06.grib2',
    )
  })

  it('fills {fh03} and bare {fh} with their own widths', () => {
    expect(fillGribUrl('x/{fh03}/{fh02}/{fh}', cycle, 7)).toBe('x/007/07/7')
  })

  it('fillMatch resolves {fhPrev} before {fh} (substring hazard)', () => {
    expect(fillMatch('APCP:surface:{fhPrev}-{fh} hour acc fcst', 7)).toBe(
      'APCP:surface:6-7 hour acc fcst',
    )
  })
})

describe('config interpretation', () => {
  it('matchWindow: hourly and unset are 1, window:N is N', () => {
    expect(matchWindow(undefined)).toBe(1)
    expect(matchWindow('hourly')).toBe(1)
    expect(matchWindow('window:6')).toBe(6)
  })

  it('matchWindow rejects unknown modes instead of summing wrong records', () => {
    expect(() => matchWindow('runTotal')).toThrow(/not supported/)
    expect(() => matchWindow('window:x')).toThrow(/invalid accumulation window/)
  })

  it('deriveMatch derives from variable/level/window and honors recordMatch', () => {
    expect(deriveMatch({ variable: 'APCP', level: 'surface' }, 7, 1)).toBe(
      'APCP:surface:6-7 hour acc fcst',
    )
    expect(deriveMatch({}, 12, 6)).toBe('APCP:surface:6-12 hour acc fcst')
    expect(deriveMatch({ recordMatch: 'QPF06:{fhPrev}-{fh}' }, 7, 1)).toBe('QPF06:6-7')
  })

  it('sourceDivisor: toInches needs mm; scale wins; zero scale throws', () => {
    expect(sourceDivisor({})).toBe(1)
    expect(sourceDivisor({ toInches: true, units: 'mm' })).toBe(25.4)
    expect(sourceDivisor({ toInches: true, units: 'mm', scale: 0.5 })).toBe(2)
    expect(() => sourceDivisor({ toInches: true, units: 'kg/m^2' })).toThrow(/mm/)
    expect(() => sourceDivisor({ scale: 0 })).toThrow(/non-zero/)
  })

  it('excludeList lowercases and accepts either config key', () => {
    expect(excludeList({ exclude: ['Prob', 'ENS STD DEV'] })).toEqual(['prob', 'ens std dev'])
    expect(excludeList({ recordExclude: ['Prob'] })).toEqual(['prob'])
    expect(excludeList({})).toEqual([])
  })

  it('inPeriod places records by END hour: (start, end]', () => {
    const night1 = { id: 'night1', startHour: 6, endHour: 18 }
    expect(inPeriod(6, night1)).toBe(false)
    expect(inPeriod(7, night1)).toBe(true)
    expect(inPeriod(18, night1)).toBe(true)
    expect(inPeriod(19, night1)).toBe(false)
  })
})

describe('.idx parsing and matching', () => {
  it('parses the real HRRR idx slice, skipping nothing valid', () => {
    const records = parseIdxText(IDX_TEXT)
    expect(records).toHaveLength(16)
    expect(records[10].offset).toBe(59518687)
    expect(records[10].line).toContain('APCP:surface:5-6 hour acc fcst')
  })

  it('skips malformed lines', () => {
    expect(parseIdxText('garbage\n1:notanumber:x\n\n2:100:d=x:APCP:\n')).toEqual([
      { offset: 100, line: '2:100:d=x:APCP:' },
    ])
  })

  it('recordRange ends at the next record and is open-ended for the last', () => {
    const records = parseIdxText(IDX_TEXT)
    expect(recordRange(records, 10)).toBe('bytes=59518687-59837656')
    expect(recordRange(records, records.length - 1)).toBe('bytes=59839824-')
  })

  it('matches the hourly APCP line, not the 0-6h accumulation', () => {
    const records = parseIdxText(IDX_TEXT)
    const index = findRecordIndex(records, 'APCP:surface:5-6 hour acc fcst', [])
    expect(index).toBe(10)
  })

  it('exclude filters same-variable lines (the NBM multi-APCP case)', () => {
    const nbm = parseIdxText(
      [
        '1:0:d=2026082512:APCP:surface:5-6 hour acc fcst:prob >0.254:',
        '2:1000:d=2026082512:APCP:surface:5-6 hour acc fcst:ens std dev:',
        '3:2000:d=2026082512:APCP:surface:5-6 hour acc fcst:',
      ].join('\n'),
    )
    expect(findRecordIndex(nbm, 'APCP:surface:5-6 hour acc fcst', ['prob', 'ens std dev'])).toBe(2)
    expect(findRecordIndex(nbm, 'APCP:surface:5-6 hour acc fcst', [])).toBe(0)
    expect(findRecordIndex(nbm, 'APCP:surface:11-12 hour acc fcst', [])).toBeNull()
  })
})

// A fake fetch serving `.idx` text and ranged record reads from fixtures.
function fetchStub(routes: {
  idx?: Record<string, string>
  records?: Record<string, Uint8Array>
  rangeStatus?: number
}): Grib2Fetch & { calls: Array<{ url: string; range?: string }> } {
  const calls: Array<{ url: string; range?: string }> = []
  const fn: Grib2Fetch = async (url, init) => {
    const range = init?.headers?.Range
    calls.push({ url, range })
    if (range != null) {
      const bytes = routes.records?.[`${url}#${range}`]
      if (!bytes)
        return { status: 404, text: async () => '', arrayBuffer: async () => new ArrayBuffer(0) }
      return {
        status: routes.rangeStatus ?? 206,
        text: async () => '',
        arrayBuffer: async () => {
          const copy = new ArrayBuffer(bytes.byteLength)
          new Uint8Array(copy).set(bytes)
          return copy
        },
      }
    }
    const text = routes.idx?.[url]
    if (text == null)
      return { status: 404, text: async () => '', arrayBuffer: async () => new ArrayBuffer(0) }
    return { status: 200, text: async () => text, arrayBuffer: async () => new ArrayBuffer(0) }
  }
  return Object.assign(fn, { calls })
}

// 18:30Z with cycleHours [0,6,12,18] makes 18z the newest candidate; only the
// 12z files exist in the stub, so selection must fall back one cycle.
const NOW = new Date('2026-08-25T18:30:00Z')

const urlFor = (fh: number) =>
  `https://noaa-hrrr-bdp-pds.s3.amazonaws.com/hrrr.20260825/conus/hrrr.t12z.wrfsfcf${String(fh).padStart(2, '0')}.grib2`

// Synthetic per-hour idx: the real APCP/WEASD offsets with the hour window
// rewritten, so every hour matches and serves the same recorded bytes.
const idxFor = (fh: number) =>
  [
    `90:59518687:d=2026082512:APCP:surface:${fh - 1}-${fh} hour acc fcst:`,
    `91:59837657:d=2026082512:WEASD:surface:${fh - 1}-${fh} hour acc fcst:`,
  ].join('\n')

describe('selectCycle', () => {
  it('probes sentinel-fh .idx newest-first and falls back through missing cycles', async () => {
    const fetchImpl = fetchStub({ idx: { [`${urlFor(6)}.idx`]: idxFor(6) } })
    const cycle = await selectCycle(fetchImpl, HRRR_TEMPLATE, [0, 6, 12, 18], 6, NOW)
    expect(cycle.toISOString()).toBe('2026-08-25T12:00:00.000Z')
    expect(fetchImpl.calls[0].url).toContain('hrrr.t18z')
  })

  it('falls back to the oldest candidate when nothing is posted', async () => {
    const fetchImpl = fetchStub({})
    const cycle = await selectCycle(fetchImpl, HRRR_TEMPLATE, [0, 6, 12, 18], 6, NOW)
    expect(cycle.toISOString()).toBe('2026-08-25T06:00:00.000Z')
  })
})

describe('extractPointValues (real HRRR record)', () => {
  it('decodes, samples nearest gridpoints, applies the divisor, caches the grid', () => {
    const cache: Grib2GridCache = new Map()
    const values = extractPointValues(RECORD_BYTES, POINTS, cache, 'hrrr', 25.4)
    expect(values.TPA).toBeCloseTo(TAMPA_MM / 25.4, 4)
    expect(values.SNQ).toBe(0)
    expect(cache.get('hrrr')?.indexes.size).toBe(2)
    // Second extraction reuses the cached indexes (same gridKey).
    const entry = cache.get('hrrr')
    extractPointValues(RECORD_BYTES, POINTS, cache, 'hrrr', 25.4)
    expect(cache.get('hrrr')).toBe(entry)
  })
})

describe('buildGrib2Model (full spine over the fixture)', () => {
  const model = {
    url: HRRR_TEMPLATE,
    config: {
      variable: 'APCP',
      level: 'surface',
      accumulation: 'hourly',
      exclude: [],
      forecastHours: { start: 6, end: 8 },
      cycleHours: [0, 6, 12, 18],
      units: 'mm',
      toInches: true,
    },
  }

  const routes = () => ({
    idx: Object.fromEntries([6, 7, 8].map((fh) => [`${urlFor(fh)}.idx`, idxFor(fh)])),
    records: Object.fromEntries(
      [6, 7, 8].map((fh) => [`${urlFor(fh)}#bytes=59518687-59837656`, RECORD_BYTES]),
    ),
  })

  it('selects the cycle, sums hours into periods by END hour, converts to inches', async () => {
    const fetchImpl = fetchStub(routes())
    const gridCache: Grib2GridCache = new Map()
    const result = await buildGrib2Model(
      fetchImpl,
      model,
      POINTS,
      GRIB_DEFAULT_PERIODS,
      gridCache,
      NOW,
    )

    expect(result.cycle.toISOString()).toBe('2026-08-25T12:00:00.000Z')
    expect(result.availableHours).toEqual([6, 7, 8])
    expect(result.errors).toEqual([])
    // fh=6 is the 5–6h accumulation — it ends AT night1's start hour, so only
    // fh 7 and 8 land in night1 (6, 18].
    expect(result.totals.night1.TPA).toBeCloseTo((2 * TAMPA_MM) / 25.4, 4)
    expect(result.totals.night1.SNQ).toBe(0)
    expect(result.totals.day2).toEqual({})
    // The nearest-point search ran once; later hours reused the cache.
    expect(gridCache.get(HRRR_TEMPLATE)?.indexes.size).toBe(2)
  })

  it('skips hours with no matching record and reports them available-less', async () => {
    const r = routes()
    r.idx = Object.fromEntries(Object.entries(r.idx).filter(([url]) => url !== `${urlFor(7)}.idx`))
    const fetchImpl = fetchStub(r)
    const result = await buildGrib2Model(
      fetchImpl,
      model,
      POINTS,
      GRIB_DEFAULT_PERIODS,
      new Map(),
      NOW,
    )
    expect(result.availableHours).toEqual([6, 8])
    expect(result.totals.night1.TPA).toBeCloseTo(TAMPA_MM / 25.4, 4)
  })

  it('collects loud per-hour errors when the server ignores Range', async () => {
    const fetchImpl = fetchStub({ ...routes(), rangeStatus: 200 })
    const result = await buildGrib2Model(
      fetchImpl,
      model,
      POINTS,
      GRIB_DEFAULT_PERIODS,
      new Map(),
      NOW,
    )
    expect(result.availableHours).toEqual([])
    expect(result.errors).toHaveLength(3)
    expect(result.errors[0]).toMatch(/^f06: expected 206/)
  })

  it('surfaces config errors as thrown errors (bad accumulation mode)', async () => {
    const bad = { ...model, config: { ...model.config, accumulation: 'runTotal' } }
    await expect(
      buildGrib2Model(fetchStub(routes()), bad, POINTS, GRIB_DEFAULT_PERIODS, new Map(), NOW),
    ).rejects.toThrow(/not supported/)
  })

  it('window:N steps by N and derives the windowed match', async () => {
    const windowed = {
      url: HRRR_TEMPLATE,
      config: { ...model.config, accumulation: 'window:6', forecastHours: { start: 6, end: 18 } },
    }
    const idx = Object.fromEntries(
      [6, 12, 18].map((fh) => [
        `${urlFor(fh)}.idx`,
        [
          `90:59518687:d=2026082512:APCP:surface:${fh - 6}-${fh} hour acc fcst:`,
          `91:59837657:d=2026082512:WEASD:surface:${fh - 6}-${fh} hour acc fcst:`,
        ].join('\n'),
      ]),
    )
    const records = Object.fromEntries(
      [6, 12, 18].map((fh) => [`${urlFor(fh)}#bytes=59518687-59837656`, RECORD_BYTES]),
    )
    const result = await buildGrib2Model(
      fetchStub({ idx, records }),
      windowed,
      POINTS,
      GRIB_DEFAULT_PERIODS,
      new Map(),
      NOW,
    )
    expect(result.availableHours).toEqual([6, 12, 18])
    // 12h and 18h totals land in night1 (6, 18]; the 0–6h total does not.
    expect(result.totals.night1.TPA).toBeCloseTo((2 * TAMPA_MM) / 25.4, 4)
  })
})

describe('buildQpfGuidance with grib2 models (artifact assembly)', () => {
  const GRIB_MODEL = {
    name: 'HRRR 3km',
    sourceType: 'grib2' as const,
    url: HRRR_TEMPLATE,
    config: {
      variable: 'APCP',
      level: 'surface',
      accumulation: 'hourly',
      forecastHours: { start: 6, end: 8 },
      cycleHours: [0, 6, 12, 18],
      units: 'mm',
      toInches: true,
    },
  }
  const WRF_MODEL = {
    name: 'WRF3UW1 1.33km',
    sourceType: 'point-json' as const,
    url: 'https://models.example.com/wrf/{run}.json',
    config: {
      stationKey: 'station',
      periodFields: { night1: 'FH24', day2: 'FH36', night2: 'FH48', day3: 'FH60' },
    },
  }
  const QPF_POINTS = [
    { code: 'TPA', name: 'Tampa', latitude: 27.95, longitude: -82.46 },
    { code: 'SNQ', name: 'Snoqualmie Pass', latitude: 47.4247, longitude: -121.4135 },
  ]
  const wrfJson: FetchJson = async (url) => {
    if (url === 'https://models.example.com/wrf/2026082512.json') {
      return [{ station: 'TPA', FH24: 0.25, FH36: 0.5 }]
    }
    throw new Error(`404 ${url}`)
  }
  const grib2Routes = () => ({
    idx: Object.fromEntries([6, 7, 8].map((fh) => [`${urlFor(fh)}.idx`, idxFor(fh)])),
    records: Object.fromEntries(
      [6, 7, 8].map((fh) => [`${urlFor(fh)}#bytes=59518687-59837656`, RECORD_BYTES]),
    ),
  })

  it('assembles the wire-shape artifact: model columns by title, grib2 meta, cycle', async () => {
    const artifact = await buildQpfGuidance([GRIB_MODEL, WRF_MODEL], QPF_POINTS, {
      now: NOW,
      fetchJson: wrfJson,
      grib2Fetch: fetchStub(grib2Routes()),
    })

    // The grib2 cycle drives artifact staleness: 6-hourly cycle boundaries.
    expect(artifact.cycle).toBe('2026-08-25T12:00:00Z')
    expect(artifact.cycleHours).toEqual([0, 6, 12, 18])

    const grib = artifact.models.find((m) => m.title === 'HRRR 3km')
    expect(grib).toMatchObject({
      sourceType: 'grib2',
      run: '2026082512',
      status: 'loaded',
      availableHours: 'f06-f08',
    })
    expect(grib?.errors).toBeUndefined()
    expect(artifact.models.find((m) => m.title === 'WRF3UW1 1.33km')?.status).toBe('loaded')

    const night1 = artifact.periods.find((p) => p.id === 'night1')
    expect(night1?.points.TPA['HRRR 3km']).toBeCloseTo(
      Math.round(((2 * TAMPA_MM) / 25.4) * 100) / 100,
      2,
    )
    expect(night1?.points.SNQ['HRRR 3km']).toBe(0)
    expect(night1?.points.TPA['WRF3UW1 1.33km']).toBe(0.25)
  })

  it('reports loud per-model errors without sinking healthy models', async () => {
    const artifact = await buildQpfGuidance([GRIB_MODEL, WRF_MODEL], QPF_POINTS, {
      now: NOW,
      fetchJson: wrfJson,
      grib2Fetch: fetchStub({ ...grib2Routes(), rangeStatus: 200 }),
    })
    const grib = artifact.models.find((m) => m.title === 'HRRR 3km')
    expect(grib?.status).toMatch(/^error: f06: expected 206/)
    expect(grib?.errors).toHaveLength(3)
    expect(grib?.availableHours).toBe('none')
    expect(artifact.models.find((m) => m.title === 'WRF3UW1 1.33km')?.status).toBe('loaded')
    // The WRF run stamps the cycle instead, on WRF's 12-hourly cadence.
    expect(artifact.cycle).toBe('2026-08-25T12:00:00Z')
    expect(artifact.cycleHours).toEqual([0, 12])
  })

  it('skips points without coordinates for grib2 sampling', async () => {
    const artifact = await buildQpfGuidance(
      [GRIB_MODEL],
      [...QPF_POINTS, { code: 'NOC', name: 'No Coords' }],
      { now: NOW, grib2Fetch: fetchStub(grib2Routes()) },
    )
    const night1 = artifact.periods.find((p) => p.id === 'night1')
    expect(night1?.points.NOC['HRRR 3km']).toBeNull()
    expect(night1?.points.TPA['HRRR 3km']).not.toBeNull()
  })
})
