import { forecastFingerprint } from '@/services/nac/forecastFingerprint'
import { mapV2ForecastResult } from '@/services/nac/sources/v2/mappers'
import { forecastResultSchema } from '@/services/nac/types/forecastSchemas'
import { isFingerprint } from '@/utilities/freshnessResponses'
import nwacForecastActive from './fixtures/nwac-forecast-active.json'

describe('forecastFingerprint', () => {
  const base = mapV2ForecastResult(forecastResultSchema.parse(nwacForecastActive))

  it('is addressable: the freshness route only accepts fingerprints of this shape', () => {
    // The routes 400 anything that doesn't match, so a fingerprint that stopped being lowercase
    // sha1 hex would lock every viewer out of the check.
    expect(isFingerprint(forecastFingerprint(base))).toBe(true)
    expect(isFingerprint(forecastFingerprint(null))).toBe(true)
  })

  it('gives "nothing published" its own address, so a first publish is a change', () => {
    expect(forecastFingerprint(null)).not.toBe(forecastFingerprint(base))
  })

  it('is stable for identical content', () => {
    const again = mapV2ForecastResult(forecastResultSchema.parse(nwacForecastActive))
    expect(forecastFingerprint(base)).toBe(forecastFingerprint(again))
  })

  it('changes when the bottom line changes (a correction)', () => {
    const corrected = { ...base, bottom_line: `${base.bottom_line ?? ''} (corrected)` }
    expect(forecastFingerprint(corrected)).not.toBe(forecastFingerprint(base))
  })

  it('changes when the product is re-issued (updated_at bumped)', () => {
    const reissued = { ...base, updated_at: '2099-01-01T00:00:00+00:00' }
    expect(forecastFingerprint(reissued)).not.toBe(forecastFingerprint(base))
  })
})
