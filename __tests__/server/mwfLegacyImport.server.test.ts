// The archive-import stitcher, exercised against the goldens captured from
// the live legacy API: period/block alignment per issuance, verbatim
// snow-level storage (drop 0), bucketed strings kept as entered values, and
// zone stitching for one legacy forecast id.
import {
  importZones,
  pointCodeByName,
  stitchLegacyForecast,
  type LegacyObjects,
} from '@/services/products/mwf/legacyImport'
import olympicsPmGolden from './fixtures/mwf/legacy-golden-olympics-pm.json'
import snoqualmieAmGolden from './fixtures/mwf/legacy-golden-snoqualmie-am.json'

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const pmObjects = olympicsPmGolden.objects as unknown as LegacyObjects
// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const amObjects = snoqualmieAmGolden.objects as unknown as LegacyObjects

const POINT_MAP = {
  'Hurricane Ridge': 'hurricane-ridge',
  'Snoqualmie Pass': 'snoqualmie-pass',
}

describe('stitchLegacyForecast', () => {
  it('maps a PM golden onto the n1/d2 window with ev1..pm2 blocks', () => {
    const out = stitchLegacyForecast({ olympics: pmObjects }, { pointCodeByName: POINT_MAP })
    expect(out).toMatchObject({
      legacyId: 4178,
      serviceDate: '2026-02-01',
      issuance: 'afternoon',
      issuedAt: '2026-02-01T22:15:15Z',
      authorName: 'Test Forecaster',
    })
    // Temps: [{min:30,max:31},{min:31,max:35}] → n1 then d2.
    expect(out?.body.temps?.olympics?.n1).toEqual({ high: 31, low: 30 })
    expect(out?.body.temps?.olympics?.d2).toEqual({ high: 35, low: 31 })
    // Snow levels [4500,4000,4500,5500] → ev1,nt1,am2,pm2 — stored verbatim
    // (drop 0) so rendering shows the published elevation.
    expect(out?.body.snowLevel?.olympics?.ev1).toEqual({ freezing: 4500, drop: 0, mode: 'snow' })
    expect(out?.body.snowLevel?.olympics?.pm2).toEqual({ freezing: 5500, drop: 0, mode: 'snow' })
    // Winds keep the legacy range strings as entered values.
    expect(out?.body.wind?.olympics?.ev1).toEqual({ dir: 'SW', speed: '10-20' })
    // Precip bucket strings stay verbatim.
    expect(out?.body.precip?.['hurricane-ridge']?.n1).toEqual({ qpf: 'LT 0.10', density: null })
    // Sensible slots from the weather_forecasts pair.
    expect(out?.body.sensible?.olympics?.morning).toMatch(/light rain and snow/)
    expect(out?.body.discussion?.synopsis).toMatch(/round of storms/)
  })

  it('maps an AM golden onto the d1/n1 window with am1..nt1 blocks', () => {
    const out = stitchLegacyForecast(
      { 'snoqualmie-pass': amObjects },
      { pointCodeByName: POINT_MAP },
    )
    expect(out).toMatchObject({ issuance: 'morning', serviceDate: '2026-02-01' })
    expect(out?.body.temps?.['snoqualmie-pass']?.d1).toBeDefined()
    expect(out?.body.snowLevel?.['snoqualmie-pass']?.am1).toBeDefined()
    expect(out?.body.precip?.['snoqualmie-pass']?.d1).toBeDefined()
  })

  it('stitches multiple zones of one legacy forecast into one body', () => {
    const westObjects: LegacyObjects = structuredClone(pmObjects)
    westObjects.five_thousand_foot_temperatures = [
      { min: 25, max: 28 },
      { min: 26, max: 33 },
    ]
    const out = stitchLegacyForecast(
      { olympics: pmObjects, 'west-slopes-north': westObjects },
      { pointCodeByName: POINT_MAP },
    )
    expect(out?.body.temps?.olympics?.n1).toEqual({ high: 31, low: 30 })
    expect(out?.body.temps?.['west-slopes-north']?.n1).toEqual({ high: 28, low: 25 })
  })

  it('returns null for an empty group', () => {
    expect(stitchLegacyForecast({}, { pointCodeByName: {} })).toBeNull()
  })
})

describe('config helpers', () => {
  it('importZones keeps only zones with a NAC id, taking the first of a list', () => {
    expect(
      importZones([
        { code: 'olympics', name: 'Olympics', nacZoneIds: '1645' },
        { code: 'multi', name: 'Multi', nacZoneIds: '1646, 1647' },
        { code: 'unmapped', name: 'Unmapped' },
      ]),
    ).toEqual([
      { id: 'olympics', name: 'Olympics', nacZoneId: '1645' },
      { id: 'multi', name: 'Multi', nacZoneId: '1646' },
    ])
  })

  it('pointCodeByName inverts the configured points', () => {
    expect(pointCodeByName([{ code: 'hurricane-ridge', name: 'Hurricane Ridge' }])).toEqual({
      'Hurricane Ridge': 'hurricane-ridge',
    })
  })
})
