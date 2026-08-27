// The MWF guidance builders and keep-last-good cache semantics, ported from
// products-api's mwf_qpf / mwf_zone / mwf_cache behaviors: run-cycle
// selection with fallback, periodFields mapping, all-null builds reporting
// "no records matched", keep-last-good on total outage, staleness on a
// passed cycle boundary, and refresh rate-limiting.
import {
  buildQpfGuidance,
  buildZoneGuidance,
  candidateCycles,
  fillUrl,
  isStale,
  reconcileWithLastGood,
  runStamp,
  selectRun,
  validateOutboundUrl,
  type FetchJson,
  type QpfArtifact,
} from '@/services/mwf/guidance'
import {
  MIN_REFRESH_INTERVAL_MS,
  modelsForTable,
  refreshGuidance,
  resetGuidanceCache,
} from '@/services/mwf/guidanceCache'

const NOW = new Date('2026-08-25T18:30:00Z')

const POINTS = [
  { code: 'HUR', name: 'Hurricane Ridge' },
  { code: 'STS', name: 'Stevens Pass' },
]

const WRF_MODEL = {
  name: 'WRF',
  sourceType: 'point-json' as const,
  url: 'https://models.example.com/wrf/{run}.json',
  config: {
    stationKey: 'station',
    periodFields: { night1: 'FH24', day2: 'FH36', night2: 'FH48', day3: 'FH60' },
  },
}

function fetchStub(routes: Record<string, unknown>): FetchJson & { calls: string[] } {
  const calls: string[] = []
  const fn = async (url: string) => {
    calls.push(url)
    if (url in routes) return routes[url]
    throw new Error(`404 ${url}`)
  }
  fn.calls = calls
  return fn
}

describe('cycle selection', () => {
  it('candidateCycles returns the most recent 00/12 anchors, newest first', () => {
    const cycles = candidateCycles(NOW, [0, 12]).map(runStamp)
    expect(cycles).toEqual(['2026082512', '2026082500', '2026082412'])
  })

  it('rolls to the previous day before the first anchor of the day', () => {
    const early = new Date('2026-08-25T03:00:00Z')
    expect(candidateCycles(early, [6, 18]).map(runStamp)).toEqual([
      '2026082418',
      '2026082406',
      '2026082318',
    ])
  })

  it('selectRun probes newest-first and falls back through missing runs', async () => {
    const fetchJson = fetchStub({ 'https://x/2026082500.json': [{ station: 'HUR' }] })
    const { run } = await selectRun(fetchJson, 'https://x/{run}.json', [0, 12], NOW)
    expect(run).toBe('2026082500')
    expect(fetchJson.calls[0]).toBe('https://x/2026082512.json')
  })
})

describe('fillUrl / validateOutboundUrl', () => {
  it('resolves run and point tokens', () => {
    expect(fillUrl('https://x/{point}/{run}.json', { run: '2026082512', point: 'HUR' })).toBe(
      'https://x/HUR/2026082512.json',
    )
  })

  it('blocks private and non-http destinations', () => {
    expect(() => validateOutboundUrl('https://models.example.com/a.json')).not.toThrow()
    expect(() => validateOutboundUrl('http://127.0.0.1/x')).toThrow(/blocked/)
    expect(() => validateOutboundUrl('http://169.254.169.254/meta')).toThrow(/blocked/)
    expect(() => validateOutboundUrl('file:///etc/passwd')).toThrow(/protocol/)
  })
})

describe('buildQpfGuidance (point JSON)', () => {
  it('maps periodFields onto the artifact periods keyed by model title', async () => {
    const fetchJson = fetchStub({
      'https://models.example.com/wrf/2026082512.json': [
        { station: 'HUR', FH24: 0.25, FH36: 0.1, FH48: 0, FH60: 1.234 },
        { station: 'STS', FH24: 0.5 },
        { station: 'IGNORED', FH24: 9 },
      ],
    })
    const artifact = await buildQpfGuidance([WRF_MODEL], POINTS, { now: NOW, fetchJson })
    expect(artifact.models[0]).toMatchObject({ title: 'WRF', run: '2026082512', status: 'loaded' })
    expect(artifact.periods[0].points.HUR.WRF).toBe(0.25)
    expect(artifact.periods[0].points.STS.WRF).toBe(0.5)
    expect(artifact.periods[1].points.HUR.WRF).toBe(0.1)
    // Rounded to hundredths like the products-api artifact.
    expect(artifact.periods[3].points.HUR.WRF).toBe(1.23)
    expect(artifact.periods[0].points.HUR.IGNORED).toBeUndefined()
  })

  it('an all-empty build reports "no records matched", not loaded', async () => {
    const fetchJson = fetchStub({
      'https://models.example.com/wrf/2026082512.json': [{ station: 'NOPE', FH24: 1 }],
    })
    const artifact = await buildQpfGuidance([WRF_MODEL], POINTS, { now: NOW, fetchJson })
    expect(artifact.models[0].status).toBe('no records matched')
  })

  it('a model without periodFields errors visibly instead of guessing', async () => {
    const model = { ...WRF_MODEL, config: {} }
    const artifact = await buildQpfGuidance([model], POINTS, { now: NOW, fetchJson: fetchStub({}) })
    expect(artifact.models[0].status).toMatch(/error: .*periodFields/)
  })
})

describe('buildZoneGuidance (zone-summary JSON)', () => {
  const TEMPS_MODEL = {
    name: 'Airfire',
    sourceType: 'zone-summary-json' as const,
    url: '',
    config: {
      table: 'temps',
      zoneKey: 'zone',
      urls: {
        high: 'https://z.example.com/max/{run}.json',
        low: 'https://z.example.com/min/{run}.json',
      },
      periodFields: { night1: 'FH24', day2: 'FH36', night2: 'FH48', day3: 'FH60' },
    },
  }

  it('assembles per-zone high/low keyed by model title', async () => {
    const fetchJson = fetchStub({
      'https://z.example.com/max/2026082512.json': [{ zone: 'ol', FH24: 31.6 }],
      'https://z.example.com/min/2026082512.json': [{ zone: 'ol', FH24: 22.4 }],
    })
    const artifact = await buildZoneGuidance([TEMPS_MODEL], 'temps', { now: NOW, fetchJson })
    expect(artifact.models[0].status).toBe('loaded')
    expect(artifact.blocks[0].zones.ol.Airfire).toEqual({ high: 32, low: 22 })
    expect(artifact.zones).toEqual(['ol'])
  })

  it('a winds model without blockFields errors visibly', async () => {
    const model = {
      name: 'W',
      sourceType: 'zone-summary-json' as const,
      url: '',
      config: {
        table: 'winds',
        urls: { speed: 'https://z/{run}.json', dir: 'https://z/{run}.json' },
      },
    }
    const artifact = await buildZoneGuidance([model], 'winds', {
      now: NOW,
      fetchJson: fetchStub({}),
    })
    expect(artifact.models[0].status).toMatch(/error: .*blockFields/)
  })
})

describe('keep-last-good + staleness', () => {
  const good: QpfArtifact = {
    available: true,
    generatedAt: '2026-08-25T12:05:00Z',
    cycle: '2026-08-25T12:00:00Z',
    cycleHours: [0, 12],
    periods: [],
    models: [{ title: 'WRF', sourceType: 'point-json', status: 'loaded' }],
    points: [],
  }

  it('a total outage keeps the previous artifact stamped refreshError', () => {
    const failed = {
      ...good,
      models: [{ title: 'WRF', sourceType: 'point-json', status: 'error: HTTP 500' }],
    }
    const kept = reconcileWithLastGood(failed, good)
    expect(kept.models[0].status).toBe('loaded')
    expect(kept.refreshError).toBe('error: HTTP 500')
  })

  it('a partial result still replaces the cache — fresher truth than old data', () => {
    const partial = {
      ...good,
      models: [
        { title: 'WRF', sourceType: 'point-json', status: 'loaded' },
        { title: 'GFS', sourceType: 'point-json', status: 'error: HTTP 500' },
      ],
    }
    expect(reconcileWithLastGood(partial, good)).toBe(partial)
  })

  it('an artifact is stale once a newer cycle boundary passes, or when kept-last-good', () => {
    expect(isStale(good, new Date('2026-08-25T13:00:00Z'))).toBe(false)
    expect(isStale(good, new Date('2026-08-26T00:30:00Z'))).toBe(true)
    expect(isStale({ ...good, refreshError: 'x' }, new Date('2026-08-25T13:00:00Z'))).toBe(true)
    expect(isStale(null)).toBe(true)
  })
})

describe('refreshGuidance cache', () => {
  beforeEach(() => resetGuidanceCache())

  const CONFIG = {
    zones: [],
    points: [
      { code: 'HUR', name: 'Hurricane Ridge', zoneCode: 'olympics', latitude: 1, longitude: 2 },
    ],
    extendedSnowLevelZones: [],
    models: [
      {
        name: 'WRF',
        sourceType: 'point-json' as const,
        url: 'https://models.example.com/wrf/{run}.json',
        config: WRF_MODEL.config,
      },
    ],
  }

  it('builds, caches, and rate-limits rebuild attempts', async () => {
    const fetchJson = fetchStub({
      'https://models.example.com/wrf/2026082512.json': [{ station: 'HUR', FH24: 0.3 }],
    })
    const first = await refreshGuidance(1, 'precip', CONFIG, { now: NOW, fetchJson })
    expect(first?.models[0].status).toBe('loaded')
    const callsAfterFirst = fetchJson.calls.length

    // Stale (cycle boundary passed) but within the min interval → cached copy.
    const later = new Date(NOW.getTime() + MIN_REFRESH_INTERVAL_MS - 1000)
    const second = await refreshGuidance(1, 'precip', CONFIG, { now: later, fetchJson })
    expect(second).toBe(first)
    expect(fetchJson.calls.length).toBe(callsAfterFirst)
  })

  it('modelsForTable routes point-json to precip and zone-summary via config.table', () => {
    const config = {
      ...CONFIG,
      models: [
        { name: 'WRF', sourceType: 'point-json' as const, url: 'u', config: {} },
        { name: 'HRRR', sourceType: 'grib2' as const, url: 'u', config: {} },
        {
          name: 'AF',
          sourceType: 'zone-summary-json' as const,
          url: '',
          config: { table: 'winds' },
        },
      ],
    }
    expect(modelsForTable(config, 'precip').map((m) => m.name)).toEqual(['WRF', 'HRRR'])
    expect(modelsForTable(config, 'winds').map((m) => m.name)).toEqual(['AF'])
    expect(modelsForTable(config, 'temps')).toEqual([])
  })
})
