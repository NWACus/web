import {
  forecastFreshnessEndpoint,
  forecastPageFingerprint,
  productFingerprint,
} from '@/services/nac/forecastFingerprint'
import { ProductType } from '@/services/nac/model/forecast'
import { mapV2ForecastResult } from '@/services/nac/sources/v2/mappers'
import { forecastResultSchema } from '@/services/nac/types/forecastSchemas'
import { isFingerprint } from '@/utilities/freshnessResponses'
import { warningFixture } from '../fixtures/warningProducts'
import nwacForecastActive from './fixtures/nwac-forecast-active.json'

const warning = warningFixture(ProductType.Warning)

describe('forecastPageFingerprint', () => {
  const base = mapV2ForecastResult(forecastResultSchema.parse(nwacForecastActive))

  it('is addressable: the freshness route only accepts fingerprints of this shape', () => {
    // The routes 400 anything that doesn't match, so a fingerprint that stopped being lowercase
    // sha1 hex would lock every viewer out of the check.
    expect(isFingerprint(forecastPageFingerprint(base, null))).toBe(true)
    expect(isFingerprint(forecastPageFingerprint(null, null))).toBe(true)
  })

  it('gives "nothing published" its own address, so a first publish is a change', () => {
    expect(forecastPageFingerprint(null, null)).not.toBe(forecastPageFingerprint(base, null))
  })

  it('is stable for identical content', () => {
    const again = mapV2ForecastResult(forecastResultSchema.parse(nwacForecastActive))
    expect(forecastPageFingerprint(base, warning)).toBe(forecastPageFingerprint(again, warning))
  })

  it('changes when the bottom line changes (a correction)', () => {
    const corrected = { ...base, bottom_line: `${base.bottom_line ?? ''} (corrected)` }
    expect(forecastPageFingerprint(corrected, null)).not.toBe(forecastPageFingerprint(base, null))
  })

  it('changes when the product is re-issued (updated_at bumped)', () => {
    const reissued = { ...base, updated_at: '2099-01-01T00:00:00+00:00' }
    expect(forecastPageFingerprint(reissued, null)).not.toBe(forecastPageFingerprint(base, null))
  })

  it('changes when an alert is issued, though the forecast is untouched', () => {
    // The whole reason the warning is in the address: this is the case a forecast-only fingerprint
    // reported as "no change" while the page was missing a live banner.
    expect(forecastPageFingerprint(base, warning)).not.toBe(forecastPageFingerprint(base, null))
  })

  it('changes when an alert is lifted', () => {
    expect(forecastPageFingerprint(base, null)).not.toBe(forecastPageFingerprint(base, warning))
  })

  it('changes when an alert is upgraded or re-worded', () => {
    const upgraded = warningFixture(ProductType.Watch)
    const reworded = warningFixture(ProductType.Warning, {
      bottom_line: 'Now covering the east slopes as well.',
    })
    expect(forecastPageFingerprint(base, upgraded)).not.toBe(forecastPageFingerprint(base, warning))
    expect(forecastPageFingerprint(base, reworded)).not.toBe(forecastPageFingerprint(base, warning))
  })
})

describe('productFingerprint', () => {
  const base = mapV2ForecastResult(forecastResultSchema.parse(nwacForecastActive))

  it('separates the two halves, so the route can purge one tag without the other', () => {
    // A warning-only change must not read as a forecast change, or every alert would force an
    // upstream forecast re-fetch it has no reason to.
    expect(productFingerprint(base)).toBe(productFingerprint({ ...base }))
    expect(productFingerprint(warning)).not.toBe(productFingerprint(base))
    expect(productFingerprint(null)).not.toBe(productFingerprint(warning))
  })
})

describe('forecastFreshnessEndpoint', () => {
  const base = mapV2ForecastResult(forecastResultSchema.parse(nwacForecastActive))
  const ZONE = 'west-slopes-north'

  it('builds the path shape the route matches', () => {
    expect(forecastFreshnessEndpoint('nwac', ZONE, base, null)).toBe(
      `/api/nwac/forecast-freshness/${ZONE}/${forecastPageFingerprint(base, null)}`,
    )
  })

  it('ends in a segment the route will accept', () => {
    // The route 400s anything that isn't lowercase sha1 hex before it goes upstream, so a builder
    // that stopped producing one would lock every viewer out of the check with no test failing.
    const segments = forecastFreshnessEndpoint('nwac', ZONE, base, warning).split('/')

    expect(isFingerprint(segments[segments.length - 1])).toBe(true)
  })

  it('encodes the zone slug, and decodes back to it', () => {
    const awkward = 'mt hood/south'
    const segments = forecastFreshnessEndpoint('nwac', awkward, base, null).split('/')

    // Encoded, so a slug carrying a slash or a space cannot forge extra path segments.
    expect(segments).toHaveLength(6)
    expect(decodeURIComponent(segments[4])).toBe(awkward)
  })

  it('is the same address whichever page asks about a zone', () => {
    // The all-zones grid and the zone page render the same product pair, so they must produce the
    // same URL — that shared address is what lets the grid ride the zone page's edge cache entry
    // instead of opening a key of its own.
    expect(forecastFreshnessEndpoint('nwac', ZONE, base, warning)).toBe(
      forecastFreshnessEndpoint('nwac', ZONE, base, warning),
    )
    expect(forecastFreshnessEndpoint('nwac', ZONE, base, warning)).not.toBe(
      forecastFreshnessEndpoint('nwac', ZONE, base, null),
    )
  })
})
