import {
  AVALANCHE_CENTERS,
  centerTimezone,
  VALID_TENANT_SLUGS,
} from '@/utilities/tenancy/avalancheCenters'
import { TIMEZONE_OPTIONS, US_TIMEZONES } from '@/utilities/timezones'

describe('center timezones', () => {
  const supported = new Set<string>(TIMEZONE_OPTIONS.map((option) => option.value))

  it.each(VALID_TENANT_SLUGS)('%s has a timezone the event picker offers', (slug) => {
    expect(supported.has(AVALANCHE_CENTERS[slug].timezone)).toBe(true)
  })

  it.each(VALID_TENANT_SLUGS)('%s has a timezone Intl recognizes', (slug) => {
    const { timezone } = AVALANCHE_CENTERS[slug]
    expect(
      new Intl.DateTimeFormat('en-US', { timeZone: timezone }).resolvedOptions().timeZone,
    ).toBe(timezone)
  })

  it('keeps Kachina Peaks on Arizona time, which does not observe DST', () => {
    expect(AVALANCHE_CENTERS.kpac.timezone).toBe(US_TIMEZONES.ARIZONA)
  })

  it('gives the DVAC template tenant the same timezone as NWAC', () => {
    expect(AVALANCHE_CENTERS.dvac.timezone).toBe(AVALANCHE_CENTERS.nwac.timezone)
  })

  describe('centerTimezone', () => {
    it.each(VALID_TENANT_SLUGS)('resolves %s to its configured zone', (slug) => {
      expect(centerTimezone(slug)).toBe(AVALANCHE_CENTERS[slug].timezone)
    })

    it('falls back to Pacific for an unrecognized slug', () => {
      expect(centerTimezone('not-a-center')).toBe(US_TIMEZONES.PACIFIC)
    })
  })
})
